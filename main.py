from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends, Path, Body
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from models import SessionLocal, Document, ExtractedText, Question, User
from utils import save_upload_file, extract_text_from_pdf, extract_text_from_image, clean_text
from sqlalchemy.orm import joinedload, Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from jose import JWTError, jwt
from dotenv import load_dotenv
from models import QuestionSource 
import openai
import os, random, smtplib
from email.mime.text import MIMEText

# -------------------- APP SETUP --------------------
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://13.53.168.33:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# -------------------- FRONTEND BUILD --------------------
frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
assets_path = os.path.join(frontend_path, "assets")

if not os.path.exists(frontend_path):
    raise Exception("Frontend not built. Run 'npm run build' inside frontend/ first.")

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# -------------------- JWT CONFIG --------------------
SECRET_KEY = "mysecretkey"   # ⚠️ Move to .env in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# -------------------- DB DEPENDENCY --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------- OTP CONFIG --------------------
otp_store = {}  # temporary in-memory store

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")  # put your gmail in .env
SMTP_PASS = os.getenv("SMTP_PASS")  # app password in .env

def send_otp_email(email: str, otp: str):
    msg = MIMEText(f"Your OTP is {otp}, valid for 5 minutes.")
    msg["Subject"] = "Verify your email"
    msg["From"] = SMTP_USER
    msg["To"] = email
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, email, msg.as_string())

# -------------------- LOGIN --------------------
class LoginRequest(BaseModel):
    email: str
    password: str
    
@app.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.password == req.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.verified:
        # Only generate OTP if not already sent or expired
        record = otp_store.get(user.email)
        if not record or datetime.utcnow() > record["expiry"]:
            otp = str(random.randint(100000, 999999))
            otp_store[user.email] = {"otp": otp, "expiry": datetime.utcnow() + timedelta(minutes=5)}
            send_otp_email(user.email, otp)

        return {"otp_needed": True, "message": "Email not verified. OTP sent to your email."}

    # Verified user → successful login
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "otp_needed": False  # explicitly for frontend
    }



# -------------------- REGISTER --------------------
class RegisterRequest(BaseModel):
    email: str
    password: str

@app.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(email=req.email, password=req.password, verified=False)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🔹 Always generate random OTP
    otp = str(random.randint(100000, 999999))
    otp_store[req.email] = {"otp": otp, "expiry": datetime.utcnow() + timedelta(minutes=5)}

    # 🔹 Send OTP email
    send_otp_email(req.email, otp)

    return {
        "message": "User registered successfully. Please verify OTP sent to your email.",
        "user_id": new_user.id
    }

# -------------------- RESEND OTP --------------------
@app.post("/resend-otp")
def resend_otp(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.verified:
        return {"message": "Email already verified. You can login."}

    otp = str(random.randint(100000, 999999))
    otp_store[email] = {"otp": otp, "expiry": datetime.utcnow() + timedelta(minutes=5)}
    send_otp_email(email, otp)
    return {"message": "New OTP sent to your email."}

# -------------------- VERIFY OTP --------------------
class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

@app.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    record = otp_store.get(req.email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    if record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.utcnow() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.verified = True
    db.commit()
    del otp_store[req.email]

    return {"message": "Email verified successfully. You can now login."}

# -------------------- GET CURRENT USER --------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# -------------------- GLOBAL SETTINGS --------------------
settings = {
    "prompt": "You are answering based on uploaded documents. Answer clearly and concisely.",
    "temperature": 0.7,
    "top_k": 40
}

class SettingsUpdate(BaseModel):
    prompt: str = None
    temperature: float = None
    top_k: int = None

@app.get("/settings")
def get_settings():
    return settings

@app.post("/settings")
def update_settings(update: SettingsUpdate):
    if update.prompt is not None:
        settings["prompt"] = update.prompt
    if update.temperature is not None:
        settings["temperature"] = update.temperature
    if update.top_k is not None:
        settings["top_k"] = update.top_k
    return {"message": "Settings updated", "settings": settings}

# -------------------- SAVE Q&A --------------------
class QnAItem(BaseModel):
    question: str
    answer: str

@app.post("/save")
def save_qna(item: QnAItem, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q_entry = Question(question_text=item.question, answer_text=item.answer, user_id=current_user.id)
    db.add(q_entry)
    db.commit()
    db.refresh(q_entry)
    return {"message": "Saved successfully", "question_id": q_entry.id}

@app.get("/saved")
def get_saved(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved_items = db.query(Question).filter(Question.user_id == current_user.id).all()
    return [{"id": q.id, "question": q.question_text, "answer": q.answer_text} for q in saved_items]

@app.delete("/saved/{q_id}")
def delete_saved(q_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q_entry = db.query(Question).filter(Question.id == q_id, Question.user_id == current_user.id).first()
    if not q_entry:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q_entry)
    db.commit()
    return {"message": "Deleted successfully"}

# -------------------- ASK QUESTION WITH REFERENCES --------------------

@app.post("/ask")
def ask_question(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    question = data.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # Get all texts of user documents
    all_texts = db.query(ExtractedText).join(Document).filter(Document.user_id == current_user.id).all()
    combined_text = "\n".join([t.content for t in all_texts if t.content])

    if not combined_text.strip():
        return {"answer": "No documents uploaded to answer from."}

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": settings['prompt']},
                {"role": "user", "content": f"Documents:\n{combined_text}\n\nQuestion:\n{question}"}
            ],
            temperature=settings["temperature"],
            max_tokens=500
        )
        answer_text = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {e}")

    # Save Q&A
    q_entry = Question(question_text=question, answer_text=answer_text, user_id=current_user.id)
    db.add(q_entry)
    db.flush()  # get q_entry.id before commit

    # Store references (top 3 matched chunks)
    matched_chunks = [
        t for t in all_texts if question.lower() in (t.content or "").lower()
    ][:3]

    for chunk in matched_chunks:
        ref = QuestionSource(
            question_id=q_entry.id,
            document_id=chunk.document_id,
            relevance_score=1.0
        )
        db.add(ref)

    db.commit()
    db.refresh(q_entry)

    # Prepare references for frontend
    refs = [
        {
            "document_id": chunk.document_id,
            "document_name": chunk.document.name if hasattr(chunk, "document") else "Document",
            "snippets": [chunk.content[:300]]
        }
        for chunk in matched_chunks
    ]

    return {
        "question_id": q_entry.id,
        "question": question,
        "answer": answer_text,
        "references": refs
    }

    
    # -------------------- GET STORIES BY SOURCE --------------------
@app.get("/stories-by-source")
def get_stories_by_source(source: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch documents matching the source
    docs = db.query(Document).filter(Document.user_id == current_user.id, Document.name.ilike(f"%{source}%")).all()
    
    stories = []
    for doc in docs:
        # get top 3 text chunks for each document
        chunks = db.query(ExtractedText).filter(ExtractedText.document_id == doc.id).limit(3).all()
        stories.append({
            "document_id": doc.id,
            "document_name": doc.name,
            "snippets": [c.content[:300] for c in chunks]
        })
    
    return {"stories": stories}



# -------------------- GET REFERENCES FOR A QUESTION --------------------
@app.get("/question/{q_id}/references")
def get_references(q_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q_entry = db.query(Question).filter(Question.id == q_id, Question.user_id == current_user.id).first()
    if not q_entry:
        raise HTTPException(status_code=404, detail="Question not found")

    refs = (
        db.query(QuestionSource)
        .join(Document)
        .filter(QuestionSource.question_id == q_id)
        .all()
    )

    results = []
    for ref in refs:
        doc = db.query(Document).filter(Document.id == ref.document_id).first()
        if doc:
            chunks = db.query(ExtractedText).filter(ExtractedText.document_id == doc.id).limit(3).all()
            results.append({
                "document_id": doc.id,
                "document_name": doc.name,
                "snippets": [c.content[:300] for c in chunks]
            })

    return {"references": results}



# -------------------- UPLOAD ENDPOINTS --------------------
@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are allowed.")
    file_path = save_upload_file(file)
    extracted = clean_text(extract_text_from_pdf(file_path))
    doc = Document(name=file.filename, type="pdf", path=file_path, status="processed", upload_date=datetime.utcnow(), user_id=current_user.id)
    db.add(doc)
    db.flush()
    text_entry = ExtractedText(document_id=doc.id, content=extracted)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    return {"message": "PDF uploaded and processed", "document_id": doc.id}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(400, "Only JPG or PNG files are allowed.")
    file_path = save_upload_file(file)
    extracted = clean_text(extract_text_from_image(file_path))
    doc = Document(name=file.filename, type="image", path=file_path, status="processed", upload_date=datetime.utcnow(), user_id=current_user.id)
    db.add(doc)
    db.flush()
    text_entry = ExtractedText(document_id=doc.id, content=extracted)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    return {"message": "Image uploaded and processed", "document_id": doc.id}

@app.post("/upload/text")
async def upload_text(name: str = Form(...), content: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cleaned_content = clean_text(content)
    doc = Document(name=name, type="text", path="N/A", status="processed", upload_date=datetime.utcnow(), user_id=current_user.id)
    db.add(doc)
    db.flush()
    text_entry = ExtractedText(document_id=doc.id, content=cleaned_content)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    return {"message": "Text submitted successfully", "document_id": doc.id}

@app.post("/upload/textfile")
async def upload_text_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".txt"):
        raise HTTPException(400, "Only .txt files are allowed.")
    content = (await file.read()).decode("utf-8")
    cleaned_content = clean_text(content)
    doc = Document(name=file.filename, type="text", path="", upload_date=datetime.utcnow(), status="processed", user_id=current_user.id)
    db.add(doc)
    db.flush()
    text_entry = ExtractedText(document_id=doc.id, content=cleaned_content)
    db.add(text_entry)
    db.commit()
    db.refresh(doc)
    return {"message": "Text file uploaded and processed", "document_id": doc.id}

# -------------------- DOCUMENT MANAGEMENT --------------------
@app.get("/documents")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [{"id": d.id, "name": d.name, "type": d.type, "path": d.path, "upload_date": d.upload_date, "status": d.status} for d in docs]

@app.get("/document/{doc_id}")
def get_document(doc_id: int = Path(..., gt=0), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).options(joinedload(Document.extracted_texts)).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    combined_text = "\n".join([et.content for et in doc.extracted_texts])
    return {"id": doc.id, "name": doc.name, "type": doc.type, "status": doc.status, "path": doc.path, "upload_date": doc.upload_date, "content": combined_text}

@app.delete("/document/{doc_id}")
def delete_document(doc_id: int = Path(..., gt=0), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.path != "N/A" and doc.path and os.path.exists(doc.path):
        os.remove(doc.path)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

@app.get("/search")
def search_documents(query: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = db.query(Document).join(ExtractedText).filter(
        Document.user_id == current_user.id,
        (Document.name.ilike(f"%{query}%")) |
        (ExtractedText.content.ilike(f"%{query}%")) |
        (Document.id == query if query.isdigit() else False)
    ).all()
    return [
        {
            "document_id": doc.id,
            "name": doc.name,
            "type": doc.type,
            "upload_date": doc.upload_date,
            "status": doc.status,
            "snippet": next((text.content[:200] for text in doc.extracted_texts if query.lower() in text.content.lower()), "")
        }
        for doc in results
    ]

# -------------------- CATCH-ALL FRONTEND ROUTE --------------------
@app.get("/{full_path:path}")
def serve_frontend(full_path: str = ""):
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "index.html not found. Build frontend first."}

# -------------------- RUN APP --------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 7860)), reload=True)
