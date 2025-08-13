import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Float, inspect, text
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
DATABASE_FILE = "documents.db"
DATABASE_URL = f"sqlite:///./{DATABASE_FILE}"
DEBUG = os.getenv("DEBUG") == "1"

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


# --- Helper function to add missing columns ---
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


# --- Create tables if they don't exist ---
Base.metadata.create_all(bind=engine)
print("✅ Database and tables created successfully.")

# --- Ensure missing columns are added ---
add_column_if_missing("documents", "age", "INTEGER")
add_column_if_missing("documents", "city", "TEXT")
