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

# Create a dedicated outputs directory for generated documents
outputs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(outputs_dir, exist_ok=True)

# Serve the generated output files securely from the outputs directory (NOT the root)
app.mount("/outputs", StaticFiles(directory=outputs_dir), name="outputs")

# Configure CORS to allow any frontend deployment or local device to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for seamless deployment
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
