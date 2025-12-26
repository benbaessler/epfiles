from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from app.core.config import get_settings
from app.services.rag_service import RAGService, RAGServiceError
from app.core.bootstrap import download_db_if_missing
from app.core.database import init_db, get_db
from app.services.db_service import DatabaseService
from app.services.rate_limiter import get_rate_limiter, RateLimitExceeded

logger = logging.getLogger(__name__)

settings = get_settings()


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract and validate user ID from X-User-Id header."""
    if settings.app_env == "development":
        return x_user_id or "dev-user"
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    return x_user_id

# Lazy RAG service - initialized after DB download in lifespan
_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    """Dependency to get the RAG service instance."""
    if _rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service not initialized")
    return _rag_service


# Free tier configuration
FREE_MESSAGE_LIMIT = 10
RATE_LIMIT_WINDOW_SECONDS = 86400  # 24 hours

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _rag_service
    # Startup: Download ChromaDB FIRST (before RAGService touches it)
    download_db_if_missing()
    # Initialize PostgreSQL database tables
    init_db()
    # Initialize rate limiter
    get_rate_limiter(max_requests=FREE_MESSAGE_LIMIT, window_seconds=RATE_LIMIT_WINDOW_SECONDS)
    # NOW initialize RAG service (after DB is downloaded)
    _rag_service = RAGService()
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
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000)
    top_k: int = Field(default=6, ge=1, le=20)
    session_id: str | None = Field(default=None, max_length=100)  # UUID format

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
    title: Optional[str] = None
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
async def health(db: Session = Depends(get_db)):
    """
    Health check endpoint that verifies all dependencies.
    
    Returns:
        Health status including database and vector store connectivity
    """
    from app.core.database import check_db_health
    
    health_status = {
        "status": "healthy",
        "checks": {
            "database": "unknown",
            "vector_store": "unknown",
        }
    }
    
    # Check PostgreSQL
    try:
        if check_db_health():
            health_status["checks"]["database"] = "healthy"
        else:
            health_status["checks"]["database"] = "unhealthy"
            health_status["status"] = "degraded"
    except Exception:
        health_status["checks"]["database"] = "unhealthy"
        health_status["status"] = "degraded"
    
    # Check ChromaDB / RAG service
    try:
        if _rag_service is not None:
            count = _rag_service.collection.count()
            health_status["checks"]["vector_store"] = "healthy"
            health_status["checks"]["vector_count"] = count
        else:
            health_status["checks"]["vector_store"] = "not_initialized"
            health_status["status"] = "degraded"
    except Exception:
        health_status["checks"]["vector_store"] = "unhealthy"
        health_status["status"] = "degraded"
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    from fastapi.responses import JSONResponse
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/api/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """
    List all conversations for the authenticated user.
    
    Requires X-User-Id header.
    """
    try:
        db_service = DatabaseService(db)
        conversations = db_service.get_user_conversations(user_id)
        return [
            ConversationResponse(
                session_id=str(conv.session_id),
                title=conv.title,
                created_at=conv.created_at.isoformat(),
                updated_at=conv.updated_at.isoformat(),
                message_count=len(conv.messages)
            )
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new conversation session.
    
    Requires X-User-Id header.
    Returns a session_id that should be used for subsequent queries.
    """
    try:
        db_service = DatabaseService(db)
        conversation = db_service.create_conversation(user_id=user_id)
        return ConversationResponse(
            session_id=str(conversation.session_id),
            title=conversation.title,
            created_at=conversation.created_at.isoformat(),
            updated_at=conversation.updated_at.isoformat(),
            message_count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{session_id}", response_model=ConversationResponse)
async def get_conversation(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """
    Get conversation metadata by session_id.
    
    Requires X-User-Id header. Only returns if user owns the conversation.
    """
    try:
        db_service = DatabaseService(db)
        conversation = db_service.get_conversation(UUID(session_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conversation.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        message_count = len(conversation.messages)
        return ConversationResponse(
            session_id=str(conversation.session_id),
            title=conversation.title,
            created_at=conversation.created_at.isoformat(),
            updated_at=conversation.updated_at.isoformat(),
            message_count=message_count
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{session_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a conversation.
    
    Requires X-User-Id header. Only returns if user owns the conversation.
    """
    try:
        db_service = DatabaseService(db)
        conversation = db_service.get_conversation(UUID(session_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conversation.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query", response_model=QueryResponse)
async def query_rag(
    request: QueryRequest,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
    rag_service: RAGService = Depends(get_rag_service),
    x_xai_api_key: Optional[str] = Header(None, alias="X-XAI-API-Key"),
):
    """
    Query the Epstein files using RAG with conversation history.

    Requires X-User-Id header.
    Returns an answer with citations from the document corpus.
    If session_id is provided, uses conversation history for context.
    If not provided, creates a new conversation session.
    
    Optional headers:
    - X-XAI-API-Key: User-provided xAI API key for unlimited usage
    """
    # Check server-side rate limits (skip in development or if user has API key)
    user_api_key = x_xai_api_key
    if not user_api_key and settings.app_env != "development":
        rate_limiter = get_rate_limiter()
        try:
            rate_limiter.check_rate_limit(user_id)
        except RateLimitExceeded as e:
            raise HTTPException(status_code=402, detail=str(e))
    
    try:
        db_service = DatabaseService(db)
        is_new_conversation = False
        
        # Get or create conversation session
        if request.session_id:
            session_id = UUID(request.session_id)
            conversation = db_service.get_conversation(session_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            if conversation.user_id != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            # Create new conversation
            conversation = db_service.create_conversation(user_id=user_id)
            session_id = conversation.session_id
            is_new_conversation = True
        
        # Get recent conversation history (optimized - only loads last N messages)
        messages = db_service.get_recent_conversation_history(
            session_id, 
            limit=settings.max_history_messages
        )
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
        
        # Auto-generate title from first message if new conversation
        if is_new_conversation or not conversation.title:
            # Use first 100 chars of the query as title
            title = request.query[:100].strip()
            if len(request.query) > 100:
                title = title.rsplit(' ', 1)[0] + '...'
            db_service.update_conversation_title(session_id, title)
        
        # Query RAG with conversation history (use user's API key if provided)
        if user_api_key:
            result = rag_service.query_with_key(request.query, user_api_key, conversation_history)
        else:
            result = rag_service.query(request.query, conversation_history)
        
        # Store assistant response
        db_service.add_message(
            session_id=session_id,
            role="assistant",
            content=result["answer"],
            sources=result["sources"],
            token_count=result["usage"]["completion_tokens"]
        )
        
        # Record the request for rate limiting (only for free tier users)
        if not user_api_key and settings.app_env != "development":
            rate_limiter = get_rate_limiter()
            rate_limiter.record_request(user_id)
        
        # Add session_id to response
        result["session_id"] = str(session_id)
        
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except HTTPException:
        raise
    except RAGServiceError as e:
        logger.error(f"RAG service error for user {user_id}: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in query_rag for user {user_id}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@app.delete("/api/conversations/{session_id}")
async def delete_conversation(
    session_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages.
    
    Requires X-User-Id header. Only deletes if user owns the conversation.
    """
    try:
        db_service = DatabaseService(db)
        deleted = db_service.delete_conversation(UUID(session_id), user_id=user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")
        return {"status": "deleted", "session_id": session_id}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

