import os
import re
import fitz  # PyMuPDF for PDF extraction
from PIL import Image
import pytesseract
from fastapi import UploadFile
from uuid import uuid4

# Directory to save uploaded files
UPLOAD_FOLDER = "/tmp/uploaded_files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Save any uploaded file (PDF/image/text) ---
def save_upload_file(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[-1]
    unique_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_name)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    return file_path

# --- Clean extracted text ---

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Remove extra whitespace (spaces, tabs, newlines)
    text = re.sub(r"\s+", " ", text)
    # Remove unwanted special characters (keep punctuation)
    text = re.sub(r"[^A-Za-z0-9\s.,!?;:()\-]", "", text)
    return text.strip()

# --- Extract text from PDF ---
def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return clean_text(text)

# --- Extract text from image using OCR ---
def extract_text_from_image(image_path: str) -> str:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return clean_text(text)
