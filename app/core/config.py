from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    openai_api_key: str  # For embeddings only
    groq_api_key: str     # For LLM inference

    # Database Configuration
    database_url: str  # PostgreSQL connection URL (Railway auto-injects DATABASE_URL)

    # RAG Configuration
    chroma_db_path: str = "./chroma_db"
    collection_name: str = "epstein_files"
    embedding_model: str = "text-embedding-3-large"
    llm_model: str = "llama-3.1-8b-instant"  # Groq's fastest model!

    # Retrieval Settings
    top_k_chunks: int = 5
    max_context_tokens: int = 8000

    # Conversation Settings
    max_history_messages: int = 10  # Maximum conversation history to send to LLM

    # API Settings
    api_title: str = "Epstein Files RAG API"
    api_version: str = "1.0.0"
    cors_origins: list = ["http://localhost:3000", "https://yourdomain.com"]

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

