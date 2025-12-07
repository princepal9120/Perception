"""Check documents in database for chat 40"""
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL")

async def check_documents():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check documents for chat 40
        result = await session.execute(
            text("SELECT id, chat_id, filename, indexed, created_at FROM documents WHERE chat_id = 40 ORDER BY created_at DESC")
        )
        docs = result.fetchall()
        
        print(f"\nDocuments for chat 40:")
        print(f"Total: {len(docs)}")
        print("-" * 80)
        if docs:
            for doc in docs:
                print(f"ID: {doc[0]}, File: {doc[2]}, Indexed: {doc[3]}, Created: {doc[4]}")
        else:
            print("❌ No documents found for chat 40!")
            print("\nTip: This means you need to UPLOAD a document first!")
            
        # Check all recent documents
        print("\n\nRecent documents (all chats):")
        all_docs = await session.execute(
            text("SELECT id, chat_id, filename, indexed, created_at FROM documents ORDER BY created_at DESC LIMIT 5")
        )
        all_results = all_docs.fetchall()
        for doc in all_results:
            print(f"  Chat {doc[1]}: {doc[2]} (indexed={doc[3]}) - {doc[4]}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_documents())
