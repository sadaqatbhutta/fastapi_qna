from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from models import SessionLocal, Document, ExtractedText
from utils import save_upload_file, extract_text_from_pdf, extract_text_from_image, clean_text
from sqlalchemy.orm import joinedload
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import os

# -------------------- APP SETUP --------------------
app = FastAPI()

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Decide static folder path based on environment
if os.environ.get("DOCKER", "false").lower() == "true":
    static_path = "/tmp/static"
else:
    static_path = os.path.join(os.path.dirname(__file__), "static")

os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Serve index.html at root
@app.get("/")
def home():
    index_file = os.path.join(static_path, "index.html")
    if not os.path.exists(index_file):
        return {"error": "index.html not found in static folder"}
    return FileResponse(index_file)

# Simple API status check
@app.get("/api")
async def read_root():
    return {"message": "Welcome to my API!"}


# -------------------- UPLOAD PDF --------------------
@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are allowed.")

    file_path = save_upload_file(file)
    extracted = clean_text(extract_text_from_pdf(file_path))

    db = SessionLocal()
    doc = Document(
        name=file.filename,
        type="pdf",
        path=file_path,
        status="processed",
        upload_date=datetime.utcnow()
    )
    db.add(doc)
    db.flush()

    text_entry = ExtractedText(document_id=doc.id, content=extracted)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    db.close()

    return {"message": "PDF uploaded and processed", "document_id": doc.id}


# -------------------- UPLOAD IMAGE --------------------
@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(400, "Only JPG or PNG files are allowed.")

    file_path = save_upload_file(file)
    extracted = clean_text(extract_text_from_image(file_path))

    db = SessionLocal()
    doc = Document(
        name=file.filename,
        type="image",
        path=file_path,
        status="processed",
        upload_date=datetime.utcnow()
    )
    db.add(doc)
    db.flush()

    text_entry = ExtractedText(document_id=doc.id, content=extracted)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    db.close()

    return {"message": "Image uploaded and processed", "document_id": doc.id}


# -------------------- UPLOAD TEXT --------------------
@app.post("/upload/text")
async def upload_text(
    name: str = Form(...),
    content: str = Form(...),
    age: int = Form(None),
    city: str = Form(None)
):
    cleaned_content = clean_text(content)

    db = SessionLocal()
    doc = Document(
        name=name,
        type="text",
        path="N/A",
        status="processed",
        upload_date=datetime.utcnow(),
        age=age,
        city=city
    )
    db.add(doc)
    db.flush()

    text_entry = ExtractedText(document_id=doc.id, content=cleaned_content)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    db.close()

    return {"message": "Text submitted successfully", "document_id": doc.id}


# -------------------- UPLOAD TEXT FILE --------------------
@app.post("/upload/textfile")
async def upload_text_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".txt"):
        raise HTTPException(400, "Only .txt files are allowed.")

    content = (await file.read()).decode("utf-8")
    cleaned_content = clean_text(content)

    db = SessionLocal()
    doc = Document(
        name=file.filename,
        type="text",
        path="",
        upload_date=datetime.utcnow(),
        status="processed"
    )
    db.add(doc)
    db.flush()

    text_entry = ExtractedText(document_id=doc.id, content=cleaned_content)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    db.close()

    return {"message": "Text file uploaded and processed", "document_id": doc.id}


# -------------------- LIST DOCUMENTS --------------------
@app.get("/documents")
def list_documents():
    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()
    return [
        {
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "path": d.path,
            "upload_date": d.upload_date,
            "status": d.status
        }
        for d in docs
    ]


# -------------------- GET DOCUMENT CONTENT --------------------
@app.get("/document/{doc_id}")
def get_document(doc_id: int):
    db = SessionLocal()
    try:
        doc = db.query(Document).options(joinedload(Document.extracted_texts)).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        combined_text = "\n".join([et.content for et in doc.extracted_texts])
        return {
            "id": doc.id,
            "name": doc.name,
            "type": doc.type,
            "status": doc.status,
            "path": doc.path,
            "upload_date": doc.upload_date,
            "content": combined_text
        }
    finally:
        db.close()


# -------------------- DELETE DOCUMENT --------------------
@app.delete("/document/{doc_id}")
def delete_document(doc_id: int):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc.path != "N/A" and os.path.exists(doc.path):
        os.remove(doc.path)

    db.delete(doc)
    db.commit()
    db.close()

    return {"message": "Document deleted successfully"}


# -------------------- SEARCH DOCUMENTS --------------------
@app.get("/search")
def search_documents(query: str = Query(..., description="Search keyword")):
    db = SessionLocal()
    try:
        results = db.query(Document).join(ExtractedText).filter(
            ExtractedText.content.ilike(f"%{query}%")
        ).all()

        return [
            {
                "document_id": doc.id,
                "name": doc.name,
                "type": doc.type,
                "upload_date": doc.upload_date,
                "status": doc.status,
                "snippet": next(
                    (text.content[:200] for text in doc.extracted_texts if query.lower() in text.content.lower()),
                    ""
                )
            }
            for doc in results
        ]
    finally:
        db.close()


# -------------------- ASK QUESTION --------------------
@app.post("/ask")
def ask_question(question: str = Form(...)):
    db = SessionLocal()
    try:
        all_texts = db.query(ExtractedText).all()
        combined_text = "\n".join(text.content for text in all_texts if text.content)

        if not combined_text.strip():
            return {"answer": "No documents uploaded to answer from."}

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(f"""
            Based on the following documents, answer the question:

            Documents:
            {combined_text}

            Question:
            {question}
        """)

        return {"question": question, "answer": response.text.strip()}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


# -------------------- CONTEXTUAL Q&A --------------------
conversation_histories = {}  # session_id -> list of previous Q&A

@app.post("/ask/contextual")
def ask_contextual(session_id: str = Form(...), question: str = Form(...)):
    db = SessionLocal()
    try:
        history = conversation_histories.get(session_id, [])
        context_text = "\n".join([f"Q: {q['question']}\nA: {q['answer']}" for q in history[-3:]])

        all_texts = db.query(ExtractedText).all()
        combined_text = "\n".join(text.content for text in all_texts if text.content)

        if not combined_text.strip():
            return {"answer": "No documents uploaded to answer from."}

        prompt = f"""
        You are answering questions based on the uploaded documents.
        Keep in mind the previous conversation history if it helps answer.

        Conversation History:
        {context_text}

        Documents:
        {combined_text}

        Current Question:
        {question}
        """

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        answer = response.text.strip()

        history.append({"question": question, "answer": answer})
        conversation_histories[session_id] = history

        return {"session_id": session_id, "question": question, "answer": answer}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


# -------------------- RUN APP --------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 7860)))
