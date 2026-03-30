"""Shared test fixtures for the backend test suite."""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from httpx import AsyncClient, ASGITransport

from app.models.tables import User, Chat, Message
from app.core.security import hash_password, create_access_token


# Use SQLite for tests (fast, no external dependencies)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    session_factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("TestPass123"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_chat(db_session: AsyncSession, test_user: User) -> Chat:
    """Create a test chat."""
    chat = Chat(
        user_id=test_user.id,
        title="Test Chat",
    )
    db_session.add(chat)
    await db_session.commit()
    await db_session.refresh(chat)
    return chat


@pytest_asyncio.fixture
async def test_messages(db_session: AsyncSession, test_user: User, test_chat: Chat) -> list[Message]:
    """Create test messages in a chat."""
    messages = []
    for i, (role, content) in enumerate([
        ("user", "Hello, AI!"),
        ("assistant", "Hello! How can I help you today?"),
        ("user", "What is Python?"),
        ("assistant", "Python is a high-level programming language."),
    ]):
        msg = Message(
            chat_id=test_chat.id,
            user_id=test_user.id,
            role=role,
            content=content,
        )
        db_session.add(msg)
        messages.append(msg)
    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)
    return messages


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Generate a valid JWT token for the test user."""
    return create_access_token(data={"sub": str(test_user.id)})
