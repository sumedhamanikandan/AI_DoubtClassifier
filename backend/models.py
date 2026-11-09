from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Enum, TIMESTAMP, Date,
    ForeignKey, func
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    preferred_subjects = Column(String(255))
    role = Column(Enum("student", "admin"), default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Doubt(Base):
    __tablename__ = "doubts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    domain = Column(String(120))
    subject = Column(String(120))
    topic = Column(String(150))
    difficulty = Column(Enum("Easy", "Medium", "Hard"))
    confidence_score = Column(Integer)
    explanation = Column(Text)
    simplified_explanation = Column(Text)
    bloom_level = Column(Integer)
    algorithm_insights = Column(Text)  # JSON string
    status = Column(Enum("Solved", "In Progress", "Unanswered"), default="Solved")
    source = Column(Enum("text", "voice", "image"), default="text")
    created_at = Column(TIMESTAMP, server_default=func.now())

    similar_questions = relationship("SimilarQuestion", backref="doubt", cascade="all, delete-orphan")
    resource_links = relationship("DoubtResource", backref="doubt", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", backref="doubt")


class SimilarQuestion(Base):
    __tablename__ = "similar_questions"
    id = Column(Integer, primary_key=True)
    doubt_id = Column(Integer, ForeignKey("doubts.id", ondelete="CASCADE"), nullable=False)
    related_question = Column(Text, nullable=False)
    similarity_score = Column(Integer, nullable=False)
    source = Column(Enum("history", "ai"), default="ai")


class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(120))
    topic = Column(String(150))
    difficulty = Column(Enum("Easy", "Medium", "Hard"))
    resource_type = Column(
        Enum("Video", "PDF", "Article", "Notes", "Practice Questions", "Documentation"),
        nullable=False,
    )
    url = Column(String(500))
    relevance_score = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())


class DoubtResource(Base):
    __tablename__ = "doubt_resources"
    id = Column(Integer, primary_key=True)
    doubt_id = Column(Integer, ForeignKey("doubts.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    relevance_score = Column(Integer)

    resource = relationship("Resource")


class ResourceBookmark(Base):
    __tablename__ = "resource_bookmarks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    doubt_id = Column(Integer, ForeignKey("doubts.id", ondelete="SET NULL"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(120))
    topic = Column(String(150))
    difficulty = Column(Enum("Easy", "Medium", "Hard"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    questions = relationship("QuizQuestion", backref="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_option = Column(Enum("A", "B", "C", "D"), nullable=False)
    explanation = Column(Text, nullable=True)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Integer, nullable=False)
    attempted_at = Column(TIMESTAMP, server_default=func.now())


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task = Column(String(255), nullable=False)
    subject = Column(String(120))
    topic = Column(String(150))
    due_date = Column(Date)
    priority = Column(Enum("High", "Medium", "Low"), default="Medium")
    is_completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ProgressTracking(Base):
    __tablename__ = "progress_tracking"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_label = Column(String(20), nullable=False)
    progress_percentage = Column(Integer, nullable=False)
    recorded_at = Column(TIMESTAMP, server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doubt_id = Column(Integer, ForeignKey("doubts.id", ondelete="SET NULL"))
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="SET NULL"))
    ai_rating = Column(Integer)
    resource_rating = Column(Integer)
    comments = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", backref="feedbacks")
    doubt = relationship("Doubt", backref="feedbacks")
    resource = relationship("Resource")
