from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
import uuid
from app.models.database import Conversation, Message, utc_now
from datetime import datetime


class DatabaseService:
    """Service for managing conversations and messages in PostgreSQL."""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create_conversation(self, user_id: str, metadata: Optional[Dict] = None) -> Conversation:
        """
        Create a new conversation session.
        
        Args:
            user_id: Clerk user ID
            metadata: Optional metadata dictionary (e.g., IP address, user agent)
            
        Returns:
            Conversation object with generated session_id
        """
        conversation = Conversation(
            session_id=uuid.uuid4(),
            user_id=user_id,
            conversation_metadata=metadata or {}
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
            conversation.updated_at = utc_now()
        
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation_history(
        self,
        session_id: UUID,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Message]:
        """
        Retrieve conversation history (messages) for a session with pagination.
        
        Args:
            session_id: UUID of the conversation
            limit: Optional limit on number of messages to retrieve
            offset: Number of messages to skip (for pagination)
            
        Returns:
            List of Message objects ordered by creation time
        """
        query = self.db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at.asc())
        
        if offset > 0:
            query = query.offset(offset)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()

    def get_recent_conversation_history(
        self,
        session_id: UUID,
        limit: int = 10
    ) -> List[Message]:
        """
        Retrieve the most recent N messages from a conversation.
        Optimized for LLM context building - returns messages in chronological order.
        
        Args:
            session_id: UUID of the conversation
            limit: Maximum number of recent messages to retrieve
            
        Returns:
            List of Message objects ordered by creation time (oldest first)
        """
        # Subquery to get the most recent message IDs
        subquery = self.db.query(Message.id).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at.desc()).limit(limit).subquery()
        
        # Fetch those messages in chronological order
        return self.db.query(Message).filter(
            Message.id.in_(subquery)
        ).order_by(Message.created_at.asc()).all()

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

    def get_user_conversations(self, user_id: str, limit: int = 50) -> List[Conversation]:
        """
        Get all conversations for a specific user.
        
        Args:
            user_id: Clerk user ID
            limit: Maximum number of conversations to return
            
        Returns:
            List of Conversation objects ordered by updated_at (newest first)
        """
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(
            Conversation.updated_at.desc()
        ).limit(limit).all()

    def update_conversation_title(self, session_id: UUID, title: str) -> Optional[Conversation]:
        """
        Update the title of a conversation.
        
        Args:
            session_id: UUID of the conversation
            title: New title for the conversation
            
        Returns:
            Updated Conversation object or None if not found
        """
        conversation = self.get_conversation(session_id)
        if conversation:
            conversation.title = title[:255] if title else None  # Truncate to max length
            self.db.commit()
            self.db.refresh(conversation)
        return conversation

    def delete_conversation(self, session_id: UUID, user_id: Optional[str] = None) -> bool:
        """
        Delete a conversation and all its messages.
        
        Args:
            session_id: UUID of the conversation to delete
            user_id: Optional user ID to verify ownership
            
        Returns:
            True if deleted, False if not found or user doesn't own it
        """
        conversation = self.get_conversation(session_id)
        if conversation:
            # If user_id provided, verify ownership
            if user_id and conversation.user_id != user_id:
                return False
            self.db.delete(conversation)
            self.db.commit()
            return True
        return False

    def get_user_message_count(self, user_id: str, since: datetime) -> int:
        """
        Count user messages (role='user') since a given datetime.
        
        Args:
            user_id: Clerk user ID
            since: Count messages created after this datetime
            
        Returns:
            Number of user messages since the given datetime
        """
        return self.db.query(func.count(Message.id)).join(
            Conversation, Message.session_id == Conversation.session_id
        ).filter(
            Conversation.user_id == user_id,
            Message.role == "user",
            Message.created_at >= since
        ).scalar() or 0

