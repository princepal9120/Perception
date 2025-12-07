"""
Database initialization utilities.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.tables import User, Chat, Message
from app.core.security import hash_password
import logging


logger = logging.getLogger(__name__)


async def init_db(session: AsyncSession) -> None:
    """
    Initialize database with seed data if needed.
    
    Args:
        session: Database session
    """
    try:
        # Check if we need to seed data
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if user is None:
            logger.info("Seeding initial database data...")
            
            # Create a test user (optional - remove in production)
            # test_user = User(
            #     username="testuser",
            #     email="test@example.com",
            #     password_hash=hash_password("Test123!")
            # )
            # session.add(test_user)
            # await session.commit()
            
            logger.info("✅ Database seeded successfully")
        else:
            logger.info("✅ Database already contains data, skipping seed")
            
    except Exception as e:
        logger.error(f"❌ Failed to seed database: {e}")
        raise


async def reset_db() -> None:
    """
    Reset database by dropping and recreating all tables.
    WARNING: This will delete all data!
    """
    from db.session import engine
    from sqlmodel import SQLModel
    
    logger.warning("❌ Resetting database - all data will be lost!")
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
            await conn.run_sync(SQLModel.metadata.create_all)
        
        logger.info("✅ Database reset successfully")
    except Exception as e:
        logger.error(f"❌ Failed to reset database: {e}")
        raise
