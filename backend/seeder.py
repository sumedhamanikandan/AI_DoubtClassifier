"""
Initial database seeder for DoubtAI.
Mirrors seed_data.sql into SQLAlchemy models so the database is pre-populated
with demo data on initial launch.
"""

from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import models


def seed_database_if_empty(db: Session):
    # Check if feedback table needs demo records
    if db.query(models.User).first():
        if db.query(models.Feedback).first() is None:
            first_user = db.query(models.User).first()
            first_doubt = db.query(models.Doubt).first()
            if first_user:
                db.add_all([
                    models.Feedback(
                        user_id=first_user.id,
                        doubt_id=first_doubt.id if first_doubt else None,
                        ai_rating=5,
                        resource_rating=5,
                        comments="The AI explanation for Java Abstract vs Interface was crystal clear and the analogies helped me prepare for my viva exam!",
                    ),
                    models.Feedback(
                        user_id=first_user.id,
                        doubt_id=first_doubt.id if first_doubt else None,
                        ai_rating=4,
                        resource_rating=5,
                        comments="Great explanation and step-by-step resolution. Practice questions were very relevant.",
                    ),
                ])
                db.commit()
        return

    print("[DoubtAI] Initializing and seeding database with demo data...")

    # 1. Users
    user1 = models.User(
        id=1,
        full_name="Sumedha",
        email="sumedha@college.edu",
        password_hash="$2b$12$replace_with_real_bcrypt_hash",
        preferred_subjects="Java, Data Structures, DBMS",
        role="student",
    )
    user2 = models.User(
        id=2,
        full_name="Admin User",
        email="admin@doubtai.app",
        password_hash="$2b$12$replace_with_real_bcrypt_hash",
        role="admin",
    )
    db.add_all([user1, user2])
    db.flush()

    # 2. Doubts
    d1 = models.Doubt(
        id=1,
        user_id=1,
        question="What is the difference between an abstract class and an interface in Java?",
        domain="Computer Science & IT",
        subject="Java / OOP",
        topic="Abstraction",
        difficulty="Medium",
        confidence_score=92,
        explanation="An abstract class is a class that cannot be instantiated and can contain both abstract methods (without bodies) and concrete methods (with bodies). An interface defines a pure contract that implementing classes must adhere to. Use abstract classes when classes share common code and state; use interfaces when disparate classes share a common contract.",
        simplified_explanation="Abstract classes are blueprints with some parts already built. Interfaces are pure checklists of methods a class must implement.",
        bloom_level=4,
        status="Solved",
        created_at=datetime.now() - timedelta(days=40),
    )
    d2 = models.Doubt(
        id=2,
        user_id=1,
        question="How do generics improve type safety in Java collections?",
        domain="Computer Science & IT",
        subject="Java / OOP",
        topic="Generics",
        difficulty="Medium",
        confidence_score=88,
        explanation="Generics allow types (classes and interfaces) to be parameters when defining classes, interfaces, and methods. By specifying element types at compile time (e.g., List<String>), the compiler ensures only valid types are added, eliminating runtime ClassCastException and manual casting.",
        simplified_explanation="Generics put label tags on containers so you can only put the right items inside, catching mistakes before you run the code.",
        bloom_level=3,
        status="Solved",
        created_at=datetime.now() - timedelta(days=38),
    )
    d3 = models.Doubt(
        id=3,
        user_id=1,
        question="Why does my BST insertion function throw a StackOverflowError?",
        domain="Computer Science & IT",
        subject="Data Structures",
        topic="BST",
        difficulty="Hard",
        confidence_score=74,
        explanation="A StackOverflowError during recursive BST insertion happens when recursion depth exceeds the call stack limit. This occurs when inserting sorted or skewed data into an unbalanced BST, creating a degenerate linked list of depth O(n), or when the base case for null leaf node insertion is missing.",
        simplified_explanation="The function calls itself too many times without stopping, filling up computer memory because the tree grew into a long straight line instead of branching evenly.",
        bloom_level=5,
        status="In Progress",
        created_at=datetime.now() - timedelta(days=35),
    )
    d4 = models.Doubt(
        id=4,
        user_id=1,
        question="What's the difference between composition and inheritance?",
        domain="Computer Science & IT",
        subject="Java / OOP",
        topic="Inheritance",
        difficulty="Easy",
        confidence_score=95,
        explanation="Inheritance represents an 'is-a' relationship where a child class inherits properties and behavior from a parent class. Composition represents a 'has-a' relationship where a class contains instances of other classes. Composition provides looser coupling and greater design flexibility.",
        simplified_explanation="Inheritance is being a type of something (a Car is a Vehicle). Composition is having something (a Car has an Engine).",
        bloom_level=2,
        status="Unanswered",
        created_at=datetime.now() - timedelta(days=30),
    )
    db.add_all([d1, d2, d3, d4])
    db.flush()

    # 3. Similar Questions
    sq1 = models.SimilarQuestion(doubt_id=3, related_question="How does a self-balancing BST differ from a regular BST?", similarity_score=91, source="history")
    sq2 = models.SimilarQuestion(doubt_id=3, related_question="What is the time complexity of BST insertion in the worst case?", similarity_score=86, source="history")
    sq3 = models.SimilarQuestion(doubt_id=3, related_question="Explain in-order traversal of a Binary Search Tree.", similarity_score=78, source="history")
    db.add_all([sq1, sq2, sq3])

    # 4. Resources
    r1 = models.Resource(title="Binary Search Trees Explained Visually", subject="Data Structures", topic="BST", difficulty="Medium", resource_type="Video", relevance_score=96, url="https://youtube.com")
    r2 = models.Resource(title="BST Operations — Lecture Notes", subject="Data Structures", topic="BST", difficulty="Medium", resource_type="Notes", relevance_score=92, url="https://example.com/notes")
    r3 = models.Resource(title="Practice Set: BST Insertions & Deletions", subject="Data Structures", topic="BST", difficulty="Hard", resource_type="Practice Questions", relevance_score=89, url="https://example.com/practice")
    r4 = models.Resource(title="Tree Data Structures — Official Docs", subject="Data Structures", topic="Trees", difficulty="Easy", resource_type="Documentation", relevance_score=84, url="https://example.com/docs")
    r5 = models.Resource(title="Understanding Tree Balancing", subject="Data Structures", topic="AVL Trees", difficulty="Hard", resource_type="Article", relevance_score=80, url="https://example.com/article")
    r6 = models.Resource(title="BST Cheat Sheet (PDF)", subject="Data Structures", topic="BST", difficulty="Easy", resource_type="PDF", relevance_score=77, url="https://example.com/cheatsheet.pdf")
    db.add_all([r1, r2, r3, r4, r5, r6])
    db.flush()

    # Doubt-Resource links
    for res in [r1, r2, r3, r4, r5, r6]:
        db.add(models.DoubtResource(doubt_id=3, resource_id=res.id, relevance_score=res.relevance_score))

    # 5. Quiz
    quiz = models.Quiz(doubt_id=3, user_id=1, subject="Data Structures & Java / OOP", topic="BST & Inheritance", difficulty="Medium")
    db.add(quiz)
    db.flush()

    q1 = models.QuizQuestion(
        quiz_id=quiz.id,
        question="What is the average time complexity of a search operation in a balanced Binary Search Tree?",
        option_a="O(1)", option_b="O(log n)", option_c="O(n)", option_d="O(n log n)",
        correct_option="B"
    )
    q2 = models.QuizQuestion(
        quiz_id=quiz.id,
        question="Which traversal of a BST visits nodes in ascending sorted order?",
        option_a="Pre-order", option_b="Post-order", option_c="In-order", option_d="Level-order",
        correct_option="C"
    )
    q3 = models.QuizQuestion(
        quiz_id=quiz.id,
        question="In Java, which keyword is used to inherit a class?",
        option_a="implements", option_b="extends", option_c="inherits", option_d="instanceof",
        correct_option="B"
    )
    q4 = models.QuizQuestion(
        quiz_id=quiz.id,
        question="Which of these is NOT a feature of an interface prior to Java 8?",
        option_a="Abstract methods", option_b="Constants", option_c="Method bodies", option_d="Multiple inheritance of type",
        correct_option="C"
    )
    db.add_all([q1, q2, q3, q4])

    # 6. Study Plans
    today = date.today()
    p1 = models.StudyPlan(user_id=1, task="Revise Binary Search Trees", subject="Data Structures", topic="BST", due_date=today, priority="High", is_completed=False)
    p2 = models.StudyPlan(user_id=1, task="Solve 10 practice problems on Generics", subject="Java / OOP", topic="Generics", due_date=today, priority="Medium", is_completed=False)
    p3 = models.StudyPlan(user_id=1, task="Read Chapter 4 — Normalization", subject="DBMS", topic="Normalization", due_date=today + timedelta(days=1), priority="Medium", is_completed=False)
    p4 = models.StudyPlan(user_id=1, task="Attempt mock quiz on Inheritance", subject="Java / OOP", topic="Inheritance", due_date=today - timedelta(days=2), priority="Low", is_completed=True)
    db.add_all([p1, p2, p3, p4])

    # 7. Progress Tracking
    pt_rows = [
        models.ProgressTracking(user_id=1, week_label="W1", progress_percentage=10),
        models.ProgressTracking(user_id=1, week_label="W2", progress_percentage=22),
        models.ProgressTracking(user_id=1, week_label="W3", progress_percentage=31),
        models.ProgressTracking(user_id=1, week_label="W4", progress_percentage=40),
        models.ProgressTracking(user_id=1, week_label="W5", progress_percentage=52),
        models.ProgressTracking(user_id=1, week_label="W6", progress_percentage=68),
    ]
    db.add_all(pt_rows)

    # 8. Quiz Attempts
    attempts = [
        models.QuizAttempt(quiz_id=quiz.id, user_id=1, score=3, total_questions=4, percentage=75),
        models.QuizAttempt(quiz_id=quiz.id, user_id=1, score=4, total_questions=4, percentage=100),
    ]
    db.add_all(attempts)

    # 9. Feedbacks
    feedbacks = [
        models.Feedback(
            user_id=1,
            doubt_id=1,
            ai_rating=5,
            resource_rating=5,
            comments="The AI explanation for Java Abstract vs Interface was crystal clear and the analogies helped me prepare for my viva exam!",
        ),
        models.Feedback(
            user_id=1,
            doubt_id=3,
            ai_rating=4,
            resource_rating=5,
            comments="Great explanation on Binary Search Trees and recursion stack depth. The recommended practice problems were very useful.",
        ),
    ]
    db.add_all(feedbacks)

    db.commit()
    print("[DoubtAI] Database seeded successfully!")

