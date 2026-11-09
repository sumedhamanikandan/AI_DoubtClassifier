from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# ---- Doubt analysis (AI) -------------------------------------------------
class DoubtAnalyzeRequest(BaseModel):
    question: str
    user_id: int = 1


class SimilarQuestionOut(BaseModel):
    question: str
    similarity: int
    source: Optional[str] = "ai"          # "history" = past doubt found by TF-IDF, "ai" = LLM suggestion
    lexical: Optional[int] = None         # raw TF-IDF cosine similarity x 100


class ResourceSuggestion(BaseModel):
    id: Optional[int] = None
    title: str
    type: str
    relevance: int
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    textSimilarity: Optional[int] = None


class QuizQuestionSuggestion(BaseModel):
    question: str
    options: List[str]
    correctIndex: int
    explanation: Optional[str] = None


class DoubtAnalyzeResponse(BaseModel):
    doubtId: int
    quizId: Optional[int] = None
    domain: str
    subject: str
    topic: str
    difficulty: str
    confidence: int
    explanation: str
    simplifiedExplanation: str
    similarQuestions: List[SimilarQuestionOut]
    resources: List[ResourceSuggestion]
    quiz: List[QuizQuestionSuggestion]
    studyPlan: List[Dict[str, Any]] = []  # AI-tailored progressive revision roadmap
    cached: bool = False
    analysis: Dict[str, Any] = {}         # step-by-step output of every algorithm


# ---- Doubts ---------------------------------------------------------------
class DoubtOut(BaseModel):
    id: int
    question: str
    domain: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    confidence_score: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Resources --------------------------------------------------------
class ResourceOut(BaseModel):
    id: int
    title: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    resource_type: str
    url: Optional[str] = None
    relevance_score: Optional[int] = None

    class Config:
        from_attributes = True


# ---- Study planner ------------------------------------------------------
class StudyPlanOut(BaseModel):
    id: int
    task: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    due_date: Optional[date] = None
    priority: str
    is_completed: bool

    class Config:
        from_attributes = True


class StudyPlanCreate(BaseModel):
    user_id: int = 1
    task: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    due_date: Optional[date] = None
    priority: str = "Medium"


class StudyPlanBatchCreate(BaseModel):
    user_id: int = 1
    tasks: List[StudyPlanCreate]


# ---- Quiz -----------------------------------------------------------------
class QuizAttemptCreate(BaseModel):
    user_id: int = 1
    score: int
    total_questions: int
    percentage: int


# ---- Feedback ---------------------------------------------------------
class FeedbackCreate(BaseModel):
    user_id: int = 1
    doubt_id: Optional[int] = None
    resource_id: Optional[int] = None
    ai_rating: Optional[int] = None
    resource_rating: Optional[int] = None
    comments: Optional[str] = None


# ---- Auth -------------------------------------------------------------
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    preferred_subjects: Optional[str] = None
    role: Optional[str] = "student"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    preferred_subjects: Optional[str] = None
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserOut
    token: str = "demo-jwt-token"
    message: str = "Success"


# ---- Admin ------------------------------------------------------------
class AdminOverviewOut(BaseModel):
    total_users: int
    total_doubts: int
    total_quizzes: int
    total_feedback: int
    avg_ai_rating: float
    avg_resource_rating: float
    domain_stats: List[Dict[str, Any]]
    total_tasks: Optional[int] = 0
    rating_counts: Optional[Dict[str, int]] = None


class AdminUserProgress(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    preferred_subjects: Optional[str] = None
    doubts_asked: int
    doubts_solved: int
    quizzes_attempted: int
    avg_quiz_score: Optional[int] = None
    tasks_completed: int
    created_at: Optional[datetime] = None


class AdminFeedbackOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    doubt_id: Optional[int] = None
    doubt_question: Optional[str] = None
    ai_rating: Optional[int] = None
    resource_rating: Optional[int] = None
    comments: Optional[str] = None
    created_at: Optional[datetime] = None


class AdminActivityOut(BaseModel):
    id: str
    type: str  # 'doubt', 'quiz', 'task', 'feedback'
    action: str
    user_id: int
    user_name: str
    user_email: str
    title: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    score: Optional[int] = None
    badge: Optional[str] = None
    status: Optional[str] = None
    timestamp: Optional[datetime] = None


