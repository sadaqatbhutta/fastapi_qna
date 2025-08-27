import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Float, inspect, text, Boolean
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# --- Base ---
Base = declarative_base()

# -------------------- USER MODEL --------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    otp = Column(String, nullable=True)  # For demo static OTP
    password = Column(String, nullable=True)
    verified = Column(Boolean, default=False)  # ✅ For OTP verification

    documents = relationship("Document", back_populates="user", cascade="all, delete")
    questions = relationship("Question", back_populates="user", cascade="all, delete")


# -------------------- DOCUMENT MODEL --------------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)  # pdf, image, text
    path = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processed")  # processed, pending, failed
    age = Column(Integer, nullable=True)
    city = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="documents")

    extracted_texts = relationship("ExtractedText", back_populates="document", cascade="all, delete")
    sources = relationship("QuestionSource", back_populates="document", cascade="all, delete")


# -------------------- EXTRACTED TEXT --------------------
class ExtractedText(Base):
    __tablename__ = "extracted_text"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(Text)
    page_number = Column(Integer, nullable=True)
    version = Column(Integer, default=1)  # ✅ New field for version control

    document = relationship("Document", back_populates="extracted_texts")
    history = relationship("TextHistory", back_populates="text", cascade="all, delete")


# -------------------- TEXT HISTORY (NEW) --------------------
class TextHistory(Base):
    __tablename__ = "text_history"

    id = Column(Integer, primary_key=True, index=True)
    text_id = Column(Integer, ForeignKey("extracted_text.id"))
    old_content = Column(Text)
    new_content = Column(Text)
    changed_at = Column(DateTime, default=datetime.utcnow)

    text = relationship("ExtractedText", back_populates="history")


# -------------------- QUESTION MODEL --------------------
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text)
    answer_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="questions")

    sources = relationship("QuestionSource", back_populates="question", cascade="all, delete")


# -------------------- QUESTION SOURCES --------------------
class QuestionSource(Base):
    __tablename__ = "question_sources"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    relevance_score = Column(Float, nullable=True)

    question = relationship("Question", back_populates="sources")
    document = relationship("Document", back_populates="sources")


# -------------------- DATABASE SETUP --------------------
DATABASE_FILE = "documents.db"
DATABASE_URL = f"sqlite:///./{DATABASE_FILE}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# -------------------- CREATE TABLES --------------------
Base.metadata.create_all(bind=engine)
print("✅ Database and tables created successfully with versioning.")


# -------------------- HELPER TO ADD MISSING COLUMNS --------------------
def add_column_if_missing(table_name, column_name, column_type):
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    if column_name not in columns:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
            conn.commit()
        print(f"✅ Column '{column_name}' added to '{table_name}' table.")
    else:
        print(f"ℹ️ Column '{column_name}' already exists in '{table_name}' table.")


# Ensure missing columns exist
add_column_if_missing("documents", "age", "INTEGER")
add_column_if_missing("documents", "city", "TEXT")
add_column_if_missing("documents", "user_id", "INTEGER")
add_column_if_missing("questions", "user_id", "INTEGER")
add_column_if_missing("users", "password", "TEXT")
add_column_if_missing("users", "verified", "BOOLEAN")
add_column_if_missing("extracted_text", "version", "INTEGER")  # ✅ new
