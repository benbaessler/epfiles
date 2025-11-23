from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.config import get_settings
from app.services.rag_service import RAGService
from app.core.bootstrap import download_db_if_missing
from app.core.database import init_db, get_db
from app.services.db_service import DatabaseService

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Download ChromaDB if needed
    download_db_if_missing()
    # Initialize PostgreSQL database tables
    init_db()
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan
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
    session_id: str = None  # Optional session ID for conversation continuity

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
    session_id: str  # Return session ID to frontend

class ConversationResponse(BaseModel):
    session_id: str
    created_at: str
    updated_at: str
    message_count: int

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: List[Dict] = []
    created_at: str
    token_count: int

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

@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(db: Session = Depends(get_db)):
    """
    Create a new conversation session.
    
    Returns a session_id that should be used for subsequent queries.
    """
    try:
        db_service = DatabaseService(db)
        conversation = db_service.create_conversation()
        return ConversationResponse(
            session_id=str(conversation.session_id),
            created_at=conversation.created_at.isoformat(),
            updated_at=conversation.updated_at.isoformat(),
            message_count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{session_id}", response_model=ConversationResponse)
async def get_conversation(session_id: str, db: Session = Depends(get_db)):
    """
    Get conversation metadata by session_id.
    """
    try:
        db_service = DatabaseService(db)
        conversation = db_service.get_conversation(UUID(session_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        message_count = len(conversation.messages)
        return ConversationResponse(
            session_id=str(conversation.session_id),
            created_at=conversation.created_at.isoformat(),
            updated_at=conversation.updated_at.isoformat(),
            message_count=message_count
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{session_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(session_id: str, db: Session = Depends(get_db)):
    """
    Get all messages for a conversation.
    """
    try:
        db_service = DatabaseService(db)
        messages = db_service.get_conversation_history(UUID(session_id))
        
        return [
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                sources=msg.sources,
                created_at=msg.created_at.isoformat(),
                token_count=msg.token_count
            )
            for msg in messages
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Query the Epstein files using RAG with conversation history.

    Returns an answer with citations from the document corpus.
    If session_id is provided, uses conversation history for context.
    If not provided, creates a new conversation session.
    """
    try:
        db_service = DatabaseService(db)
        
        # Get or create conversation session
        if request.session_id:
            session_id = UUID(request.session_id)
            conversation = db_service.get_conversation(session_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation = db_service.create_conversation()
            session_id = conversation.session_id
        
        # Get conversation history
        messages = db_service.get_conversation_history(session_id)
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # Store user message
        db_service.add_message(
            session_id=session_id,
            role="user",
            content=request.query
        )
        
        # Query RAG with conversation history
        result = rag_service.query(request.query, conversation_history)
        
        # Store assistant response
        db_service.add_message(
            session_id=session_id,
            role="assistant",
            content=result["answer"],
            sources=result["sources"],
            token_count=result["usage"]["completion_tokens"]
        )
        
        # Add session_id to response
        result["session_id"] = str(session_id)
        
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

