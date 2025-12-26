from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
import logging
from app.core.config import get_settings
from app.models.database import Base

settings = get_settings()
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine with configurable pool settings
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize database by creating all tables.
    Should be called on application startup.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def get_db() -> Session:
    """
    Dependency function to get database session.
    Use with FastAPI's Depends() for automatic session management.
    
    Usage:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            # Use db here
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions.
    Use when you need manual session management outside of FastAPI dependencies.
    
    Usage:
        with get_db_context() as db:
            # Use db here
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> bool:
    """
    Check if database connection is healthy.
    Returns True if connection works, False otherwise.
    """
    try:
        with get_db_context() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False

