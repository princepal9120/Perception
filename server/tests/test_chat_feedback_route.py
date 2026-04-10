"""Integration tests for chat message feedback routes."""

import os
import sys
import types
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Avoid importing the production DB engine during route tests.
fake_db_session = types.ModuleType("app.db.session")


async def _unused_get_db():
    raise RuntimeError("Test should override get_db before use")


fake_db_session.get_db = _unused_get_db
sys.modules.setdefault("app.db.session", fake_db_session)

from app.core.dependencies import get_current_active_user, get_db  # noqa: E402
from app.models.tables import User  # noqa: E402
from app.routes.chat_routes import router as chat_router  # noqa: E402

app = FastAPI()
app.include_router(chat_router, prefix="/api/v1")


@pytest_asyncio.fixture
async def route_client(
    db_session: AsyncSession,
    test_user: User,
) -> AsyncGenerator[AsyncClient, None]:
    """Create an API client with auth/db dependencies overridden for tests."""

    async def override_get_db():
        yield db_session

    async def override_get_current_active_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user

    with patch("app.services.chat_service.redis_client") as mock_redis:
        mock_redis.add_user_session = AsyncMock(return_value=True)
        mock_redis.delete = AsyncMock(return_value=True)
        mock_redis.remove_user_session = AsyncMock(return_value=True)
        mock_redis.get_cached_messages = AsyncMock(return_value=None)
        mock_redis.cache_messages = AsyncMock(return_value=True)
        mock_redis.add_message_to_cache = AsyncMock(return_value=True)
        mock_redis.get_session_key = lambda chat_id: f"session:{chat_id}:messages"

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_message_feedback_route(route_client: AsyncClient, test_chat, test_messages):
    assistant_message = next(message for message in test_messages if message.role == "assistant")

    response = await route_client.patch(
        f"/api/v1/chats/{test_chat.id}/messages/{assistant_message.id}/feedback",
        json={"liked": True},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == assistant_message.id
    assert body["metadata"]["feedback"]["liked"] is True
    assert "updated_at" in body["metadata"]["feedback"]


@pytest.mark.asyncio
async def test_update_message_feedback_route_rejects_user_messages(route_client: AsyncClient, test_chat, test_messages):
    user_message = next(message for message in test_messages if message.role == "user")

    response = await route_client.patch(
        f"/api/v1/chats/{test_chat.id}/messages/{user_message.id}/feedback",
        json={"liked": True},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Feedback is only supported for assistant messages"
