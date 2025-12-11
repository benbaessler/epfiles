from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from app.core.config import get_settings
from app.services.rag_service import RAGService
from app.core.bootstrap import download_db_if_missing
from app.core.database import init_db, get_db
from app.services.db_service import DatabaseService

settings = get_settings()

# Tier limits configuration
TIER_LIMITS = {
    "free": 15,
    "explore": 150,
    "research": 1000,
}


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract and validate user ID from X-User-Id header."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    return x_user_id


def get_user_tier(x_user_tier: Optional[str] = Header(None, alias="X-User-Tier")) -> str:
    """Extract user tier from X-User-Tier header, defaults to 'free'."""
    return x_user_tier if x_user_tier in TIER_LIMITS else "free"


def get_billing_period_start() -> datetime:
    """Returns the 1st of the current month in UTC."""
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def check_usage_limit(user_id: str, tier: str, db_service: DatabaseService) -> Tuple[bool, int, int]:
    """
    Check if user has exceeded their usage limit.
    
    Args:
        user_id: Clerk user ID
        tier: User's subscription tier (free, explore, research)
        db_service: Database service instance
        
    Returns:
        Tuple of (allowed, current_count, limit)
    """
    limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    since = get_billing_period_start()
    current = db_service.get_user_message_count(user_id, since)
    return (current < limit, current, limit)

# Lazy RAG service - initialized after DB download in lifespan
_rag_service: RAGService = None

def get_rag_service() -> RAGService:
    """Dependency to get the RAG service instance."""
    if _rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service not initialized")
    return _rag_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _rag_service
    # Startup: Download ChromaDB FIRST (before RAGService touches it)
    download_db_if_missing()
    # Initialize PostgreSQL database tables
    init_db()
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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "usage": "/api/usage",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}


class UsageResponse(BaseModel):
    current: int
    limit: int
    tier: str
    resets_at: str


@app.get("/api/usage", response_model=UsageResponse)
async def get_usage(
    user_id: str = Depends(get_user_id),
    tier: str = Depends(get_user_tier),
    db: Session = Depends(get_db)
):
    """
    Get current usage stats for the authenticated user.
    
    Requires X-User-Id header.
    Optional X-User-Tier header (defaults to 'free').
    """
    db_service = DatabaseService(db)
    _, current, limit = check_usage_limit(user_id, tier, db_service)
    
    # Calculate next reset date (1st of next month)
    now = datetime.now(timezone.utc)
    if now.month == 12:
        next_reset = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        next_reset = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    return UsageResponse(
        current=current,
        limit=limit,
        tier=tier,
        resets_at=next_reset.isoformat()
    )


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
    tier: str = Depends(get_user_tier),
    db: Session = Depends(get_db),
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Query the Epstein files using RAG with conversation history.

    Requires X-User-Id header.
    Optional X-User-Tier header (defaults to 'free').
    Returns an answer with citations from the document corpus.
    If session_id is provided, uses conversation history for context.
    If not provided, creates a new conversation session.
    """
    try:
        db_service = DatabaseService(db)
        
        # Check usage limit before processing
        allowed, current, limit = check_usage_limit(user_id, tier, db_service)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "usage_limit_exceeded",
                    "message": f"You've reached your {limit} message limit this month",
                    "current": current,
                    "limit": limit,
                    "tier": tier
                }
            )
        
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
        
        # Auto-generate title from first message if new conversation
        if is_new_conversation or not conversation.title:
            # Use first 100 chars of the query as title
            title = request.query[:100].strip()
            if len(request.query) > 100:
                title = title.rsplit(' ', 1)[0] + '...'
            db_service.update_conversation_title(session_id, title)
        
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

