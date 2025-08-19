import os
import faiss
import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer

# Load local embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim embeddings

def get_embedding(text: str) -> np.ndarray:
    return embedding_model.encode(text)

def split_text(text: str, max_tokens: int = 300) -> List[str]:
    # Naive split — keep it simple for now
    lines = text.split("\n")
    chunks = []
    current = []
    current_len = 0
    for line in lines:
        tokens = len(line.split())
        if current_len + tokens > max_tokens:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.append(line)
        current_len += tokens
    if current:
        chunks.append(" ".join(current))
    return chunks

class VectorStore:
    def __init__(self):
        self.text_chunks: List[str] = []
        self.index = faiss.IndexFlatL2(384)  # Because MiniLM embedding size is 384

    def embed(self, text: str) -> np.ndarray:
        return get_embedding(text).astype("float32")

    def chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        tokens = text.split()
        return [' '.join(tokens[i:i + chunk_size]) for i in range(0, len(tokens), chunk_size)]

    def add_documents(self, text: str):
        chunks = self.chunk_text(text)
        for chunk in chunks:
            embedding = self.embed(chunk)
            self.index.add(np.array([embedding]))
            self.text_chunks.append(chunk)

    def search(self, query: str, top_k: int = 5) -> List[str]:
        embedding = self.embed(query)
        D, I = self.index.search(np.array([embedding]), top_k)
        return [self.text_chunks[i] for i in I[0] if i < len(self.text_chunks)]
