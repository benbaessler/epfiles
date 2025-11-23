from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from app.models.database import Conversation, Message
from datetime import datetime


class DatabaseService:
    """Service for managing conversations and messages in PostgreSQL."""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create_conversation(self, metadata: Optional[Dict] = None) -> Conversation:
        """
        Create a new conversation session.
        
        Args:
            metadata: Optional metadata dictionary (e.g., IP address, user agent)
            
        Returns:
            Conversation object with generated session_id
        """
        conversation = Conversation(
            session_id=uuid.uuid4(),
            metadata=metadata or {}
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation(self, session_id: UUID) -> Optional[Conversation]:
        """
        Retrieve a conversation by session_id.
        
        Args:
            session_id: UUID of the conversation
            
        Returns:
            Conversation object or None if not found
        """
        return self.db.query(Conversation).filter(
            Conversation.session_id == session_id
        ).first()

    def add_message(
        self,
        session_id: UUID,
        role: str,
        content: str,
        sources: Optional[List[Dict]] = None,
        token_count: int = 0
    ) -> Message:
        """
        Add a message to a conversation.
        
        Args:
            session_id: UUID of the conversation
            role: 'user' or 'assistant'
            content: Message content
            sources: Optional list of source citations (for assistant messages)
            token_count: Optional token count for the message
            
        Returns:
            Created Message object
        """
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            sources=sources or [],
            token_count=token_count
        )
        self.db.add(message)
        
        # Update conversation's updated_at timestamp
        conversation = self.get_conversation(session_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation_history(
        self,
        session_id: UUID,
        limit: Optional[int] = None
    ) -> List[Message]:
        """
        Retrieve conversation history (messages) for a session.
        
        Args:
            session_id: UUID of the conversation
            limit: Optional limit on number of messages to retrieve (most recent)
            
        Returns:
            List of Message objects ordered by creation time
        """
        query = self.db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at.asc())
        
        if limit:
            # Get the most recent N messages
            # First, get total count
            total = query.count()
            if total > limit:
                # Skip older messages
                query = query.offset(total - limit)
        
        return query.all()

    def get_all_conversations(self, limit: int = 100) -> List[Conversation]:
        """
        Get all conversations (for admin/analytics purposes).
        
        Args:
            limit: Maximum number of conversations to return
            
        Returns:
            List of Conversation objects ordered by creation time (newest first)
        """
        return self.db.query(Conversation).order_by(
            Conversation.created_at.desc()
        ).limit(limit).all()

    def delete_conversation(self, session_id: UUID) -> bool:
        """
        Delete a conversation and all its messages.
        
        Args:
            session_id: UUID of the conversation to delete
            
        Returns:
            True if deleted, False if not found
        """
        conversation = self.get_conversation(session_id)
        if conversation:
            self.db.delete(conversation)
            self.db.commit()
            return True
        return False

