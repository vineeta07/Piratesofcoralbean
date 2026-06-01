from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from backend.pipeline.orchestrator import pipeline_orchestrator
import uvicorn
import os

import mimetypes

# Fix for Windows registry sometimes having incorrect MIME types for web assets
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app = FastAPI(title="Sales Deal Intelligence API")

# Serve the generated output files
app.mount("/outputs", StaticFiles(directory="."), name="outputs")

# Configure CORS for Next.js frontend (allow Vercel and localhost)
# Allow specific origins for security; wildcard doesn't work with credentials
allowed_origins = [
    "https://piratesofcoralbean.vercel.app",
    "https://piratesofcoralbean.onrender.com",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

class QueryRequest(BaseModel):
    query: str

@app.get('/api/health')
def health_check():
    return {'status': 'ok'}

@app.post('/api/analyze')
def analyze_query(request: QueryRequest):
    result = pipeline_orchestrator.analyze_query(request.query)
    return result

# Mount the Next.js static files
frontend_out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "out")
os.makedirs(frontend_out_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=frontend_out_dir, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8080, reload=True)
