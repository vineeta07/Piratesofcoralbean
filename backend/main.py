from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.pipeline.orchestrator import pipeline_orchestrator
import uvicorn

app = FastAPI(title="Sales Deal Intelligence API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon
    allow_credentials=True,
    allow_methods=["*"],
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

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
