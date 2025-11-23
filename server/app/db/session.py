"""
Database session management and connection pooling.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from sqlmodel import SQLModel
from app.core.config import settings
import logging


logger = logging.getLogger(__name__)

# Create async engine with proper connection pool management
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable SQL query logging
    future=True,
    pool_pre_ping=True,  # Test connections before using them
    pool_size=settings.DB_POOL_SIZE,  # Number of persistent connections
    max_overflow=settings.DB_MAX_OVERFLOW,  # Additional connections when pool is full
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Timeout for getting connection from pool
    connect_args={
        "server_settings": {
            "application_name": "perception_api",
            "jit": "off"
        },
        "timeout": 10,  # Connection timeout
        "command_timeout": 30,  # Command execution timeout
    }
)

# Create session factory with proper settings
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
    autocommit=False,  # Manual transaction control
    autoflush=False,  # Manual flush control
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.
    Ensures proper connection cleanup even on exceptions.
    
    Yields:
        AsyncSession: Database session
    """
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        await session.close()
        logger.debug("Database session closed")


async def create_tables():
    """Create all database tables."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        raise


async def check_database_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


async def close_database_connection():
    """Close database connection and dispose engine."""
    try:
        await engine.dispose()
        logger.info("✅ Database connection closed")
    except Exception as e:
        logger.error(f"❌ Error closing database connection: {e}")
