"""
Migration script to add branch tracking columns to chats table.
Run this script once to add the new columns.
"""
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def add_branch_columns():
    """Add parent_chat_id and branch_message_id columns to chats table."""
    async with engine.begin() as conn:
        # Check if columns already exist
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'chats' AND column_name = 'parent_chat_id'
        """))
        
        if result.fetchone() is None:
            print("Adding parent_chat_id column...")
            await conn.execute(text("""
                ALTER TABLE chats 
                ADD COLUMN parent_chat_id INTEGER REFERENCES chats(id),
                ADD COLUMN branch_message_id INTEGER
            """))
            
            # Add index for parent_chat_id
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chats_parent ON chats(parent_chat_id)
            """))
            
            print("✅ Branch tracking columns added successfully!")
        else:
            print("ℹ️ Branch tracking columns already exist.")

if __name__ == "__main__":
    asyncio.run(add_branch_columns())
