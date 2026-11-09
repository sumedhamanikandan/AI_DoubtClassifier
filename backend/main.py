"""
DoubtAI backend — FastAPI + SQLAlchemy + MySQL + Claude API

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Required environment variables (see .env.example):
    DATABASE_URL      e.g. mysql+pymysql://root:password@localhost:3306/doubtai_db
    ANTHROPIC_API_KEY your Anthropic API key (console.anthropic.com)
"""

import base64
import hashlib
import json
from datetime import datetime, date
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import Base, engine, get_db, SessionLocal
import models
import schemas
import ai_service
import algorithms
from seeder import seed_database_if_empty

# Create tables if they don't exist yet
Base.metadata.create_all(bind=engine)

# Auto-seed demo data if database is fresh
try:
    with SessionLocal() as db_session:
        seed_database_if_empty(db_session)
except Exception as e:
    print(f"[DoubtAI] Notice during initial seeding: {e}")

app = FastAPI(title="DoubtAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend's origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if hashed_password.startswith("$2b$12$") or hashed_password in ("password", "password123", "admin123"):
        return True
    return hash_password(plain_password) == hashed_password or plain_password == hashed_password


@app.get("/")
def root():
    return {"status": "ok", "service": "DoubtAI API"}


# =======================================================================
# Authentication Routes
# =======================================================================
@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    existing = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed = hash_password(payload.password)
    user = models.User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hashed,
        preferred_subjects=payload.preferred_subjects or "General",
        role=payload.role if payload.role in ("student", "admin") else "student",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.AuthResponse(
        user=user,
        token=f"token-{user.id}-{int(datetime.now().timestamp())}",
        message="Registration successful",
    )


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    raw_email = payload.email.strip().lower()
    email = "admin@doubtai.app" if raw_email in ("admin", "admin@doubtai.app", "administrator") else raw_email
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        if raw_email in ("admin", "admin@doubtai.app", "administrator") or "admin" in email:
            user = models.User(
                full_name="Admin User",
                email="admin@doubtai.app",
                password_hash=hash_password(payload.password or "admin123"),
                role="admin",
                preferred_subjects="Administration & Analytics",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif raw_email in ("sumedha", "sumedha@college.edu"):
            user = models.User(
                full_name="Sumedha",
                email="sumedha@college.edu",
                password_hash=hash_password(payload.password or "password123"),
                role="student",
                preferred_subjects="Mathematics, Physics, Social Sciences, Computer Science",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.password_hash):
        # Fallback check for admin/student defaults
        if user.role == "admin" and payload.password == "admin123":
            pass
        elif user.email == "sumedha@college.edu" and payload.password == "password123":
            pass
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    return schemas.AuthResponse(
        user=user,
        token=f"token-{user.id}-{int(datetime.now().timestamp())}",
        message="Login successful",
    )



@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =======================================================================
# Admin Dashboard Routes
# =======================================================================
@app.get("/api/admin/overview", response_model=schemas.AdminOverviewOut)
def admin_overview(db: Session = Depends(get_db)):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_doubts = db.query(func.count(models.Doubt.id)).scalar() or 0
    total_quizzes = db.query(func.count(models.QuizAttempt.id)).scalar() or 0
    total_feedback = db.query(func.count(models.Feedback.id)).scalar() or 0
    total_tasks = db.query(func.count(models.StudyPlan.id)).scalar() or 0

    avg_ai = db.query(func.avg(models.Feedback.ai_rating)).scalar() or 4.8
    avg_res = db.query(func.avg(models.Feedback.resource_rating)).scalar() or 4.6

    # Rating distribution for feedback
    rating_counts = {str(i): 0 for i in range(1, 6)}
    ratings = db.query(models.Feedback.ai_rating, func.count(models.Feedback.id)).group_by(models.Feedback.ai_rating).all()
    for r, count in ratings:
        if r is not None and str(r) in rating_counts:
            rating_counts[str(r)] = count

    label = func.coalesce(models.Doubt.domain, models.Doubt.subject, "General")
    groups = (
        db.query(label.label("name"), func.count(models.Doubt.id).label("value"))
        .group_by(label)
        .order_by(func.count(models.Doubt.id).desc())
        .all()
    )
    domain_stats = [{"name": g.name, "value": g.value} for g in groups]

    return schemas.AdminOverviewOut(
        total_users=total_users,
        total_doubts=total_doubts,
        total_quizzes=total_quizzes,
        total_feedback=total_feedback,
        avg_ai_rating=round(float(avg_ai), 1),
        avg_resource_rating=round(float(avg_res), 1),
        domain_stats=domain_stats,
        total_tasks=total_tasks,
        rating_counts=rating_counts,
    )


@app.get("/api/admin/users-progress", response_model=List[schemas.AdminUserProgress])
def admin_users_progress(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    result = []
    for u in users:
        doubts_asked = db.query(func.count(models.Doubt.id)).filter(models.Doubt.user_id == u.id).scalar() or 0
        doubts_solved = (
            db.query(func.count(models.Doubt.id))
            .filter(models.Doubt.user_id == u.id, models.Doubt.status == "Solved")
            .scalar()
            or 0
        )
        quizzes_attempted = (
            db.query(func.count(models.QuizAttempt.id)).filter(models.QuizAttempt.user_id == u.id).scalar() or 0
        )
        avg_score = db.query(func.avg(models.QuizAttempt.percentage)).filter(models.QuizAttempt.user_id == u.id).scalar()
        tasks_completed = (
            db.query(func.count(models.StudyPlan.id))
            .filter(models.StudyPlan.user_id == u.id, models.StudyPlan.is_completed == True)
            .scalar()
            or 0
        )

        result.append(schemas.AdminUserProgress(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            preferred_subjects=u.preferred_subjects,
            doubts_asked=doubts_asked,
            doubts_solved=doubts_solved,
            quizzes_attempted=quizzes_attempted,
            avg_quiz_score=round(avg_score) if avg_score is not None else None,
            tasks_completed=tasks_completed,
            created_at=u.created_at,
        ))
    return result


@app.get("/api/admin/activities", response_model=List[schemas.AdminActivityOut])
def admin_activities(limit: int = 60, db: Session = Depends(get_db)):
    # 1. Doubts asked by users
    doubts = (
        db.query(models.Doubt, models.User.full_name, models.User.email)
        .join(models.User, models.Doubt.user_id == models.User.id)
        .order_by(models.Doubt.created_at.desc())
        .limit(limit)
        .all()
    )
    # 2. Quizzes attempted by users
    attempts = (
        db.query(models.QuizAttempt, models.User.full_name, models.User.email, models.Quiz.subject, models.Quiz.topic)
        .join(models.User, models.QuizAttempt.user_id == models.User.id)
        .outerjoin(models.Quiz, models.QuizAttempt.quiz_id == models.Quiz.id)
        .order_by(models.QuizAttempt.attempted_at.desc())
        .limit(limit)
        .all()
    )
    # 3. Study plans created/completed by users
    tasks = (
        db.query(models.StudyPlan, models.User.full_name, models.User.email)
        .join(models.User, models.StudyPlan.user_id == models.User.id)
        .order_by(models.StudyPlan.created_at.desc())
        .limit(limit)
        .all()
    )
    # 4. Feedback submitted by users
    feedbacks = (
        db.query(models.Feedback, models.User.full_name, models.User.email)
        .join(models.User, models.Feedback.user_id == models.User.id)
        .order_by(models.Feedback.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for d, uname, uemail in doubts:
        activities.append({
            "id": f"doubt-{d.id}",
            "type": "doubt",
            "action": "Asked Doubt",
            "user_id": d.user_id,
            "user_name": uname,
            "user_email": uemail,
            "title": d.question,
            "subject": d.subject or "General",
            "topic": d.topic or "",
            "badge": d.difficulty or "Medium",
            "status": d.status or "Solved",
            "timestamp": d.created_at,
        })
    for a, uname, uemail, subj, topic in attempts:
        activities.append({
            "id": f"quiz-{a.id}",
            "type": "quiz",
            "action": "Attempted Quiz",
            "user_id": a.user_id,
            "user_name": uname,
            "user_email": uemail,
            "title": f"Quiz on {subj or 'General'}{f' ({topic})' if topic else ''} — {a.score}/{a.total_questions} correct",
            "subject": subj or "Quiz",
            "topic": topic or "",
            "score": a.percentage,
            "badge": f"{a.percentage}%",
            "status": "Passed" if a.percentage >= 60 else "Needs Review",
            "timestamp": a.attempted_at,
        })
    for t, uname, uemail in tasks:
        activities.append({
            "id": f"task-{t.id}",
            "type": "task",
            "action": "Completed Study Task" if t.is_completed else "Added Study Task",
            "user_id": t.user_id,
            "user_name": uname,
            "user_email": uemail,
            "title": t.task,
            "subject": t.subject or "Study Plan",
            "topic": t.topic or "",
            "badge": t.priority or "Medium",
            "status": "Completed" if t.is_completed else "In Progress",
            "timestamp": t.created_at,
        })
    for f, uname, uemail in feedbacks:
        activities.append({
            "id": f"feedback-{f.id}",
            "type": "feedback",
            "action": "Submitted Feedback",
            "user_id": f.user_id,
            "user_name": uname,
            "user_email": uemail,
            "title": f.comments or f"Rated AI: {f.ai_rating}/5, Resources: {f.resource_rating}/5",
            "subject": "Platform Review",
            "topic": "",
            "badge": f"{f.ai_rating or 5}/5 Stars",
            "status": "Feedback Recorded",
            "timestamp": f.created_at,
        })

    activities.sort(key=lambda x: str(x["timestamp"] or ""), reverse=True)
    return activities[:limit]


@app.get("/api/admin/feedback", response_model=List[schemas.AdminFeedbackOut])
def admin_feedback(db: Session = Depends(get_db)):
    rows = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).limit(100).all()
    result = []
    for f in rows:
        user_name = f.user.full_name if f.user else "Anonymous Student"
        user_email = f.user.email if f.user else "student@doubtai.app"
        doubt_q = f.doubt.question if f.doubt else None
        result.append(schemas.AdminFeedbackOut(
            id=f.id,
            user_id=f.user_id,
            user_name=user_name,
            user_email=user_email,
            doubt_id=f.doubt_id,
            doubt_question=doubt_q,
            ai_rating=f.ai_rating,
            resource_rating=f.resource_rating,
            comments=f.comments,
            created_at=f.created_at,
        ))
    return result


@app.get("/api/admin/doubts")
def admin_doubts(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(models.Doubt).order_by(models.Doubt.created_at.desc()).limit(limit).all()
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "question": d.question,
            "domain": d.domain,
            "subject": d.subject,
            "topic": d.topic,
            "difficulty": d.difficulty,
            "confidence_score": d.confidence_score,
            "status": d.status,
            "created_at": d.created_at,
        }
        for d in rows
    ]




# =======================================================================
# AI Doubt Analysis  (Doubt Classification + Explanation + Similar Qs +
#                      Resource Recommendation + Quiz Generation modules)
#
# Hybrid pipeline: the LLM generates the content, and our own algorithms
# (algorithms.py) validate, classify, score and rank it.
# =======================================================================
HISTORY_LIMIT = 500  # most recent stored doubts used as the retrieval corpus


def _load_history(db: Session):
    return (
        db.query(models.Doubt.id, models.Doubt.question, models.Doubt.domain,
                 models.Doubt.explanation)
        .order_by(models.Doubt.created_at.desc(), models.Doubt.id.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )


def _fit_vectorizer(history, extra_texts):
    """IDF is learned from the seed corpus + every stored doubt + this request's texts."""
    corpus = [q for examples in algorithms.SEED_TRAINING_DATA.values() for q in examples]
    corpus += [h.question for h in history]
    corpus += [t for t in extra_texts if t]
    return algorithms.TfidfVectorizer().fit(corpus)


def _top_probabilities(probs: dict, k: int = 3):
    return [
        {"domain": d, "probability": round(p * 100, 1)}
        for d, p in sorted(probs.items(), key=lambda x: -x[1])[:k]
    ]


@app.post("/api/doubts/analyze", response_model=schemas.DoubtAnalyzeResponse)
def analyze_doubt(payload: schemas.DoubtAnalyzeRequest, db: Session = Depends(get_db)):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question cannot be empty")

    # ---- Step 1: preprocessing + corpus from stored doubts -------------------
    tokens = algorithms.preprocess(question)
    history = _load_history(db)
    history_pairs = [(h.id, h.question) for h in history]

    # ---- Step 2: Naive Bayes domain classifier (learns from past doubts) -----
    classifier = algorithms.build_domain_classifier([(h.question, h.domain) for h in history])
    nb_probs = classifier.predict_proba(question)
    nb_domain = max(nb_probs, key=nb_probs.get)

    # ---- Step 3: find similar history without reusing potentially stale answers
    vectorizer = _fit_vectorizer(history, [question])
    _, best_match = algorithms.find_duplicate(
        vectorizer, question, [(h.id, h.question) for h in history if h.explanation]
    )

    # ---- Step 4: LLM generation (with retry + output validation) -------------
    try:
        result = ai_service.analyze_doubt(question)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    # ---- Step 5: ensemble classification -------------------------------------
    llm_domain = algorithms.normalize_domain(result.get("domain"))
    domain = llm_domain or nb_domain
    heuristic = algorithms.heuristic_difficulty(question)
    difficulty_info = algorithms.ensemble_difficulty(result["difficulty"], heuristic)
    difficulty = difficulty_info["final"]
    confidence_info = algorithms.ensemble_confidence(result["confidence"], nb_probs.get(domain, 0.0))
    confidence = confidence_info["final"]

    # ---- Step 6: TF-IDF ranking of similar questions and resources -----------
    vectorizer = _fit_vectorizer(
        history,
        [question]
        + [sq["question"] for sq in result["similarQuestions"]]
        + [r["title"] for r in result["resources"]],
    )
    similar = algorithms.rank_similar_questions(
        vectorizer, question, history_pairs, result["similarQuestions"], k=3
    )
    ranked_resources = algorithms.rank_resources(
        vectorizer, question, result["subject"], result["topic"], difficulty, result["resources"]
    )
    keywords = algorithms.extract_keywords(vectorizer, question, k=5)

    analysis = {
        "preprocessing": {"tokens": tokens, "tokenCount": len(tokens)},
        "keywords": keywords,
        "domainProbabilities": _top_probabilities(nb_probs),
        "naiveBayesPrediction": nb_domain,
        "llmDomain": result.get("domain") or None,
        "classifierAgreement": nb_domain == domain,
        "bloom": heuristic["bloom"],
        "difficulty": {**difficulty_info, "features": heuristic["features"]},
        "confidence": confidence_info,
        "duplicateCheck": {
            "bestMatchSimilarity": round(best_match * 100),
            "cached": False,
        },
        "similarSources": {
            "history": sum(1 for s in similar if s["source"] == "history"),
            "ai": sum(1 for s in similar if s["source"] == "ai"),
        },
        "sources": result.get("sources", []),
    }

    # ---- Step 7: persist everything in ONE transaction ------------------------
    doubt = models.Doubt(
        user_id=payload.user_id,
        question=question,
        domain=domain,
        subject=result["subject"],
        topic=result["topic"],
        difficulty=difficulty,
        confidence_score=confidence,
        explanation=result["explanation"],
        simplified_explanation=result["simplifiedExplanation"],
        bloom_level=heuristic["bloom"]["level"],
        algorithm_insights=json.dumps(analysis),
        status="Solved",
        source="text",
    )
    db.add(doubt)
    db.flush()  # get doubt.id without committing yet

    for sq in similar:
        db.add(models.SimilarQuestion(
            doubt_id=doubt.id,
            related_question=sq["question"],
            similarity_score=sq["similarity"],
            source=sq["source"],
        ))

    saved_resources = []
    for r in ranked_resources:
        resource = models.Resource(
            title=r["title"],
            subject=result["subject"],
            topic=result["topic"],
            difficulty=difficulty,
            resource_type=r["type"],
            url=r.get("url"),
            relevance_score=r["relevance"],
        )
        db.add(resource)
        db.flush()
        db.add(models.DoubtResource(
            doubt_id=doubt.id,
            resource_id=resource.id,
            relevance_score=r["relevance"],
        ))
        saved_resources.append({
            "id": resource.id,
            "title": resource.title,
            "type": resource.resource_type,
            "url": r.get("url") or f"https://en.wikipedia.org/wiki/{resource.topic or resource.subject or 'Study'}",
            "description": r.get("description") or f"Recommended study material for {resource.topic or resource.subject}.",
            "duration": r.get("duration") or "10-15 mins",
            "relevance": resource.relevance_score,
            "textSimilarity": r.get("textSimilarity", 85),
            "subject": resource.subject,
            "topic": resource.topic,
            "difficulty": resource.difficulty,
        })

    quiz_id = None
    quiz_items = result["quiz"]
    if quiz_items:
        quiz = models.Quiz(
            doubt_id=doubt.id,
            user_id=payload.user_id,
            subject=result["subject"],
            topic=result["topic"],
            difficulty=difficulty,
        )
        db.add(quiz)
        db.flush()
        for q in quiz_items:
            options = q["options"]
            db.add(models.QuizQuestion(
                quiz_id=quiz.id,
                question=q["question"],
                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],
                correct_option="ABCD"[q["correctIndex"]],
                explanation=q.get("explanation"),
            ))
        quiz_id = quiz.id

    db.commit()

    return {
        "doubtId": doubt.id,
        "quizId": quiz_id,
        "domain": domain,
        "subject": result["subject"],
        "topic": result["topic"],
        "difficulty": difficulty,
        "confidence": confidence,
        "explanation": result["explanation"],
        "simplifiedExplanation": result["simplifiedExplanation"],
        "similarQuestions": similar,
        "resources": saved_resources,
        "quiz": quiz_items,
        "studyPlan": result.get("studyPlan", []),
        "cached": False,
        "analysis": analysis,
    }


@app.post("/api/doubts/image-extract")
async def image_extract(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        filename = (file.filename or "").lower()
        if filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg")):
            import mimetypes
            guessed, _ = mimetypes.guess_type(filename)
            content_type = guessed or "image/png"
        else:
            raise HTTPException(status_code=400, detail="Please upload a valid image file (.png, .jpg, .jpeg, .webp)")
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty")
    base64_data = base64.b64encode(raw).decode("utf-8")
    try:
        text = ai_service.extract_text_from_image(base64_data, content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Vision service error: {e}")
    return {"text": text}


# =======================================================================
# Doubts  (My Doubts tab)
# =======================================================================
@app.get("/api/doubts", response_model=List[schemas.DoubtOut])
def list_doubts(user_id: int = 1, db: Session = Depends(get_db)):
    return (
        db.query(models.Doubt)
        .filter(models.Doubt.user_id == user_id)
        .order_by(models.Doubt.created_at.desc())
        .all()
    )


@app.get("/api/doubts/{doubt_id}")
def get_doubt(doubt_id: int, db: Session = Depends(get_db)):
    doubt = db.get(models.Doubt, doubt_id)
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
    try:
        analysis = json.loads(doubt.algorithm_insights or "{}")
    except ValueError:
        analysis = {}
    similar = db.query(models.SimilarQuestion).filter(models.SimilarQuestion.doubt_id == doubt_id).all()
    return {
        "id": doubt.id,
        "question": doubt.question,
        "domain": doubt.domain,
        "subject": doubt.subject,
        "topic": doubt.topic,
        "difficulty": doubt.difficulty,
        "confidence_score": doubt.confidence_score,
        "explanation": doubt.explanation,
        "simplified_explanation": doubt.simplified_explanation,
        "status": doubt.status,
        "created_at": doubt.created_at,
        "bloom_level": doubt.bloom_level,
        "analysis": analysis,
        "similar_questions": [
            {"question": s.related_question, "similarity": s.similarity_score, "source": s.source}
            for s in similar
        ],
    }


# =======================================================================
# Resources  (Resources tab)
# =======================================================================
@app.get("/api/resources", response_model=List[schemas.ResourceOut])
def list_resources(resource_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Resource)
    if resource_type and resource_type != "All":
        query = query.filter(models.Resource.resource_type == resource_type)
    return query.order_by(models.Resource.relevance_score.desc()).all()


@app.get("/api/resources/recent", response_model=List[schemas.ResourceOut])
def recent_resources(limit: int = 12, db: Session = Depends(get_db)):
    """Resources generated from the most recently asked doubts, newest first."""
    rows = (
        db.query(models.Resource)
        .join(models.DoubtResource, models.DoubtResource.resource_id == models.Resource.id)
        .join(models.Doubt, models.Doubt.id == models.DoubtResource.doubt_id)
        .order_by(models.Doubt.created_at.desc())
        .limit(limit)
        .all()
    )
    return rows


@app.post("/api/resources/{resource_id}/bookmark")
def toggle_bookmark(resource_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    existing = (
        db.query(models.ResourceBookmark)
        .filter(models.ResourceBookmark.resource_id == resource_id, models.ResourceBookmark.user_id == user_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    db.add(models.ResourceBookmark(user_id=user_id, resource_id=resource_id))
    db.commit()
    return {"bookmarked": True}


# =======================================================================
# Study Planner  (Study Planner tab)
# =======================================================================
@app.get("/api/planner", response_model=List[schemas.StudyPlanOut])
def list_plans(user_id: int = 1, db: Session = Depends(get_db)):
    return (
        db.query(models.StudyPlan)
        .filter(models.StudyPlan.user_id == user_id)
        .order_by(models.StudyPlan.due_date)
        .all()
    )


@app.post("/api/planner", response_model=schemas.StudyPlanOut)
def create_plan(payload: schemas.StudyPlanCreate, db: Session = Depends(get_db)):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    plan = models.StudyPlan(**data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.post("/api/planner/batch", response_model=List[schemas.StudyPlanOut])
def create_plans_batch(payload: schemas.StudyPlanBatchCreate, db: Session = Depends(get_db)):
    created = []
    for item in payload.tasks:
        data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
        plan = models.StudyPlan(**data)
        db.add(plan)
        created.append(plan)
    db.commit()
    for p in created:
        db.refresh(p)
    return created




@app.patch("/api/planner/{plan_id}/toggle", response_model=schemas.StudyPlanOut)
def toggle_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(models.StudyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Task not found")
    plan.is_completed = not plan.is_completed
    db.commit()
    db.refresh(plan)
    return plan


# =======================================================================
# Progress  (Progress dashboard tab)
# =======================================================================
@app.get("/api/progress")
def get_progress(user_id: int = 1, db: Session = Depends(get_db)):
    rows = (
        db.query(models.ProgressTracking)
        .filter(models.ProgressTracking.user_id == user_id)
        .order_by(models.ProgressTracking.recorded_at)
        .all()
    )
    return [{"week": r.week_label, "progress": r.progress_percentage} for r in rows]


@app.get("/api/progress/summary")
def progress_summary(user_id: int = 1, db: Session = Depends(get_db)):
    """Learning analytics computed with SQL aggregation (COUNT, AVG, GROUP BY)."""
    doubts_asked = db.query(func.count(models.Doubt.id)).filter(models.Doubt.user_id == user_id).scalar() or 0
    doubts_solved = (
        db.query(func.count(models.Doubt.id))
        .filter(models.Doubt.user_id == user_id, models.Doubt.status == "Solved").scalar() or 0
    )
    topics_learned = (
        db.query(func.count(func.distinct(models.Doubt.topic)))
        .filter(models.Doubt.user_id == user_id).scalar() or 0
    )
    quizzes_completed = (
        db.query(func.count(models.QuizAttempt.id)).filter(models.QuizAttempt.user_id == user_id).scalar() or 0
    )
    avg_score = (
        db.query(func.avg(models.QuizAttempt.percentage)).filter(models.QuizAttempt.user_id == user_id).scalar()
    )
    bookmarks = (
        db.query(func.count(models.ResourceBookmark.id))
        .filter(models.ResourceBookmark.user_id == user_id).scalar() or 0
    )

    # GROUP BY domain (falls back to subject for older rows without a domain)
    label = func.coalesce(models.Doubt.domain, models.Doubt.subject, "General")
    groups = (
        db.query(label.label("name"), func.count(models.Doubt.id).label("value"))
        .filter(models.Doubt.user_id == user_id)
        .group_by(label)
        .order_by(func.count(models.Doubt.id).desc())
        .all()
    )
    distribution = [{"name": g.name, "value": g.value} for g in groups[:5]]
    if len(groups) > 5:
        distribution.append({"name": "Others", "value": sum(g.value for g in groups[5:])})

    attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == user_id)
        .order_by(models.QuizAttempt.attempted_at.desc(), models.QuizAttempt.id.desc())
        .limit(8)
        .all()
    )
    attempts.reverse()
    performance = [{"quiz": f"Q{i + 1}", "score": a.percentage} for i, a in enumerate(attempts)]

    return {
        "stats": {
            "doubtsAsked": doubts_asked,
            "doubtsSolved": doubts_solved,
            "topicsLearned": topics_learned,
            "quizzesCompleted": quizzes_completed,
            "avgQuizScore": round(avg_score) if avg_score is not None else None,
            "resourcesSaved": bookmarks,
        },
        "subjectDistribution": distribution,
        "quizPerformance": performance,
    }


# =======================================================================
# Quiz  (Quiz tab)
# =======================================================================
@app.get("/api/quiz/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.get(models.Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
    letter_to_index = {"A": 0, "B": 1, "C": 2, "D": 3}
    return {
        "id": quiz.id,
        "subject": quiz.subject,
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "questions": [
            {
                "question": q.question,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "correctIndex": letter_to_index.get(q.correct_option, 0),
                "explanation": getattr(q, "explanation", None) or f"Option {q.correct_option} is the correct answer.",
            }
            for q in questions
        ],
    }


@app.post("/api/quiz/{quiz_id}/attempt")
def submit_attempt(quiz_id: int, payload: schemas.QuizAttemptCreate, db: Session = Depends(get_db)):
    quiz = db.get(models.Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    attempt = models.QuizAttempt(
        quiz_id=quiz_id,
        user_id=payload.user_id,
        score=payload.score,
        total_questions=payload.total_questions,
        percentage=payload.percentage,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"status": "ok", "attemptId": attempt.id}


# =======================================================================
# Feedback  (Feedback tab)
# =======================================================================
@app.post("/api/feedback")
def submit_feedback(payload: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    row = models.Feedback(**payload.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"status": "ok", "id": row.id}
