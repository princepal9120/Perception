# app/db/session.py
"""
Database session management and engine configuration.
Handles async PostgreSQL connections using SQLAlchemy 2.0.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from ..core.config import settings
from .base import Base

# Configure logging for database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True,  # Use SQLAlchemy 2.0 syntax
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,  # Recycle connections every hour
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Maximum overflow connections
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Keep objects accessible after commit
    autoflush=False,  # Don't auto-flush changes
    autocommit=False,  # Use explicit commits
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    
    This function provides a database session for FastAPI dependency injection.
    It ensures proper session management with automatic cleanup.
    
    Yields:
        AsyncSession: Database session for use in route handlers
    """
    async with AsyncSessionLocal() as session:
        try:
            logger.debug("Creating new database session")
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            logger.debug("Closing database session")
            await session.close()


async def create_tables():
    """
    Create all database tables.
    
    This function creates all tables defined by SQLAlchemy models.
    Should be called on application startup.
    """
    try:
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from ..models import user  # noqa: F401
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise


async def check_database_connection():
    """
    Check if database connection is working.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


async def close_database_connection():
    """
    Close database connection pool.
    
    Should be called on application shutdown to properly close
    all database connections.
    """
    try:
        logger.info("Closing database connections...")
        await engine.dispose()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")


# Database session context manager for manual session handling
class DatabaseSession:
    """
    Context manager for manual database session handling.
    
    Usage:
        async with DatabaseSession() as session:
            # Use session for database operations
            result = await session.execute(select(User))
    """
    
    def __init__(self):
        self.session: AsyncSession = None
    
    async def __aenter__(self) -> AsyncSession:
        """Enter the context and create a new session."""
        self.session = AsyncSessionLocal()
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit the context and close the session."""
        if exc_type:
            await self.session.rollback()
        await self.session.close()