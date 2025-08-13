import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Float
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
DATABASE_FILE = "documents.db"
DATABASE_URL = f"sqlite:///./{DATABASE_FILE}"
DEBUG = os.getenv("DEBUG") == "1"

# --- Optional: Remove old DB in DEBUG mode ---
# if DEBUG and os.path.exists(DATABASE_FILE):
#     os.remove(DATABASE_FILE)
#     print("🗑️ Old database removed (DEBUG mode)!")

# --- SQLAlchemy setup ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# --- Models ---

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
    extracted_texts = relationship("ExtractedText", back_populates="document", cascade="all, delete")
    sources = relationship("QuestionSource", back_populates="document", cascade="all, delete")


class ExtractedText(Base):
    __tablename__ = "extracted_text"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(Text)
    page_number = Column(Integer, nullable=True)
    

    document = relationship("Document", back_populates="extracted_texts")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text)
    answer_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    sources = relationship("QuestionSource", back_populates="question", cascade="all, delete")


class QuestionSource(Base):
    __tablename__ = "question_sources"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    relevance_score = Column(Float, nullable=True)

    question = relationship("Question", back_populates="sources")
    document = relationship("Document", back_populates="sources")


# --- Create tables ---
Base.metadata.create_all(bind=engine)
print("✅ Database and tables created successfully.")  