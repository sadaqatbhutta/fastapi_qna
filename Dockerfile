FROM python:3.10

# Project ka working directory set karo
WORKDIR /code

# Dependencies install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baaki code copy karo
COPY . .

# FastAPI ko run karo (port 7860 Hugging Face ke liye standard hai)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
