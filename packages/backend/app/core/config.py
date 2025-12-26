from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import Literal
from pathlib import Path
import json

# Determine the root .env path (two levels up from this file)
ROOT_ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / ".env"

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    openai_api_key: str  # For embeddings
    xai_api_key: str | None = None  # Optional - users can provide via X-XAI-API-Key header

    # Database Configuration
    database_url: str  # PostgreSQL connection URL (Railway auto-injects DATABASE_URL)

    # RAG Configuration
    chroma_db_path: str = "./chroma_db"
    collection_name: str = "epstein_files"
    embedding_model: str = "text-embedding-3-large"
    
    # LLM Configuration (xAI/Grok only)
    llm_model: str = "grok-4-1-fast-reasoning"
    llm_max_tokens: int = 1000
    llm_temperature: float = 0.1
    xai_base_url: str = "https://api.x.ai/v1"

    # Retrieval Settings
    top_k_chunks: int = 6
    min_similarity_threshold: float = 0.3  # Filter out chunks below this similarity score
    max_context_tokens: int = 8000

    # Conversation Settings
    max_history_messages: int = 10  # Maximum conversation history to send to LLM

    # API Settings
    api_title: str = "Epstein Files RAG API"
    api_version: str = "1.0.0"
    
    # Environment mode: "development" or "production"
    app_env: Literal["development", "production"] = "development"
    
    # CORS origins - set via CORS_ORIGINS env var as JSON array in production
    # e.g. CORS_ORIGINS='["https://yourapp.com"]'
    cors_origins: list[str] = []
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from JSON string if provided."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError("CORS_ORIGINS must be a valid JSON array")
        return v
    
    def get_cors_origins(self) -> list[str]:
        """
        Return CORS origins based on environment.
        - Development: allows localhost:3000
        - Production: requires explicit CORS_ORIGINS, rejects unsafe placeholders
        """
        if self.app_env == "development":
            if not self.cors_origins:
                return ["http://localhost:3000"]
            return self.cors_origins
        
        # Production mode
        if not self.cors_origins:
            raise ValueError(
                "CORS_ORIGINS must be set in production. "
                "Set CORS_ORIGINS='[\"https://your-domain.com\"]' as a JSON array."
            )
        
        # Reject unsafe placeholder origins in production
        unsafe_patterns = ["localhost", "yourdomain.com", "127.0.0.1"]
        for origin in self.cors_origins:
            for pattern in unsafe_patterns:
                if pattern in origin.lower():
                    raise ValueError(
                        f"Unsafe CORS origin '{origin}' not allowed in production. "
                        "Remove localhost/placeholder domains from CORS_ORIGINS."
                    )
        
        return self.cors_origins

    class Config:
        # Load from root .env first, fall back to local .env
        env_file = (str(ROOT_ENV_PATH), ".env")
        extra = "ignore"  # Ignore extra env vars (e.g., Clerk keys for interface)

@lru_cache()
def get_settings():
    return Settings()
