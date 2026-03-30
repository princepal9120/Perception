"""Test Pinecone connection"""
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

print(f"PINECONE_API_KEY: {api_key[:20]}..." if api_key else "PINECONE_API_KEY: NOT SET")
print(f"PINECONE_INDEX_NAME: {index_name}")

if api_key:
    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=api_key)
        indexes = pc.list_indexes()
        print(f"\n✅ Pinecone connection successful!")
        print(f"Available indexes: {[i.name for i in indexes]}")
    except Exception as e:
        print(f"\n❌ Pinecone connection failed: {type(e).__name__}: {str(e)}")
else:
    print("\n❌ PINECONE_API_KEY not set in .env file")
