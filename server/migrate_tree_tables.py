"""
Database migration script for conversation tree tables.
Run this to add the new tree tables to your existing database.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from app.core.config import settings
from app.models.conversation_tree import ConversationNode, ConversationTree, NodeRelationship
from app.models.tables import User, Chat, Message, Document
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_migration():
    """Run the migration to create tree tables."""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True
    )
    
    try:
        logger.info("Starting database migration for conversation trees...")
        
        # Create all tables (will only create new ones)
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            logger.info("Creating conversation tree tables...")
            await conn.run_sync(SQLModel.metadata.create_all)
        
        logger.info("✅ Migration completed successfully!")
        logger.info("✅ New tables created:")
        logger.info("   - conversation_nodes")
        logger.info("   - conversation_trees")
        logger.info("   - node_relationships")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()


async def verify_tables():
    """Verify that the tables were created."""
    from sqlalchemy import inspect
    
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    )
    
    try:
        async with engine.connect() as conn:
            def _inspect(connection):
                inspector = inspect(connection)
                return inspector.get_table_names()
            
            tables = await conn.run_sync(_inspect)
            
            logger.info("\nCurrent database tables:")
            for table in sorted(tables):
                logger.info(f"   ✓ {table}")
            
            # Check for tree tables
            tree_tables = ['conversation_nodes', 'conversation_trees', 'node_relationships']
            missing = [t for t in tree_tables if t not in tables]
            
            if missing:
                logger.warning(f"\n❌ Missing tables: {missing}")
            else:
                logger.info("\n✅ All tree tables present!")
                
    except Exception as e:
        logger.error(f"❌ Verification failed: {str(e)}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("Conversation Tree Database Migration")
    print("=" * 60)
    print()
    
    # Run migration
    asyncio.run(run_migration())
    
    print()
    print("=" * 60)
    print("Verifying Migration")
    print("=" * 60)
    print()
    
    # Verify
    asyncio.run(verify_tables())
    
    print()
    print("=" * 60)
    print("Migration Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart your FastAPI server")
    print("2. Test the tree endpoints at /docs")
    print("3. Migrate existing chats using POST /api/tree/migrate")
