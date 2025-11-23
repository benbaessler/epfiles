from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Conversation(Base):
    """Conversation session table."""
    __tablename__ = "conversations"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    conversation_metadata = Column(JSONB, default={})  # Store additional metadata (IP, user agent, etc.)

    # Relationship to messages
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(session_id={self.session_id}, created_at={self.created_at})>"


class Message(Base):
    """Message table for storing conversation messages."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("conversations.session_id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSONB, default=[])  # Store citations for assistant messages
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    token_count = Column(Integer, default=0)  # Optional: track token usage per message

    # Relationship to conversation
    conversation = relationship("Conversation", back_populates="messages")

    # Index for efficient queries
    __table_args__ = (
        Index("idx_session_created", "session_id", "created_at"),
    )

    def __repr__(self):
        return f"<Message(id={self.id}, session_id={self.session_id}, role={self.role})>"

