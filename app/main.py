from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from app.core.config import get_settings
from app.services.rag_service import RAGService

settings = get_settings()

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = RAGService()

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class Source(BaseModel):
    chunk_id: str
    score: float
    doc_id: str
    page_start: int
    page_end: int
    text: str
    source_filename: str

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[Source]
    model: str
    usage: Dict[str, int]

@app.get("/")
async def root():
    return {
        "message": "Epstein Files RAG API",
        "version": settings.api_version,
        "endpoints": {
            "query": "/api/query",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the Epstein files using RAG.

    Returns an answer with citations from the document corpus.
    """
    try:
        result = rag_service.query(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

