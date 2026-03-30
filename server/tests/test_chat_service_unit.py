"""Unit tests for the ChatService."""
import sys
from unittest.mock import MagicMock

# Mock upstash_redis before any app imports that depend on it
_mock_upstash = MagicMock()
sys.modules.setdefault("upstash_redis", _mock_upstash)

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from app.services.chat_service import ChatService
from app.models.tables import User, Chat, Message
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException


@pytest.mark.asyncio
class TestChatService:
    @pytest_asyncio.fixture
    async def service(self, db_session: AsyncSession, test_user: User):
        """Create a ChatService instance with mocked Redis."""
        with patch("app.services.chat_service.redis_client") as mock_redis:
            mock_redis.add_user_session = AsyncMock(return_value=True)
            mock_redis.delete = AsyncMock(return_value=True)
            mock_redis.remove_user_session = AsyncMock(return_value=True)
            mock_redis.get_cached_messages = AsyncMock(return_value=None)
            mock_redis.cache_messages = AsyncMock(return_value=True)
            mock_redis.add_message_to_cache = AsyncMock(return_value=True)
            mock_redis.check_rate_limit = AsyncMock(return_value=(True, 19))
            mock_redis.get_session_key = lambda chat_id: f"session:{chat_id}:messages"
            yield ChatService(db_session, test_user)

    async def test_create_chat(self, service: ChatService):
        chat = await service.create_chat("New Chat")
        assert chat.title == "New Chat"
        assert chat.id is not None

    async def test_get_user_chats(self, service: ChatService):
        await service.create_chat("Chat 1")
        await service.create_chat("Chat 2")
        chats, total = await service.get_user_chats()
        assert total == 2
        assert len(chats) == 2

    async def test_get_chat_not_found(self, service: ChatService):
        with pytest.raises(HTTPException) as exc_info:
            await service.get_chat(99999)
        assert exc_info.value.status_code == 404

    async def test_get_chat_access_denied(self, service: ChatService, db_session: AsyncSession):
        # Create a chat for a different user
        other_user = User(name="Other", email="other@test.com", password_hash="hash")
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_chat = Chat(user_id=other_user.id, title="Private")
        db_session.add(other_chat)
        await db_session.commit()
        await db_session.refresh(other_chat)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_chat(other_chat.id)
        assert exc_info.value.status_code == 403

    async def test_update_chat(self, service: ChatService):
        chat = await service.create_chat("Original Title")
        updated = await service.update_chat(chat.id, title="Updated Title")
        assert updated.title == "Updated Title"

    async def test_delete_chat(self, service: ChatService):
        chat = await service.create_chat("To Delete")
        result = await service.delete_chat(chat.id)
        assert result is True

    async def test_create_message(self, service: ChatService):
        chat = await service.create_chat("Chat")
        msg = await service.create_message(chat.id, "user", "Hello!")
        assert msg.content == "Hello!"
        assert msg.role == "user"
        assert msg.chat_id == chat.id

    async def test_get_messages(self, service: ChatService):
        chat = await service.create_chat("Chat")
        await service.create_message(chat.id, "user", "Hello!")
        await service.create_message(chat.id, "assistant", "Hi!")
        messages, total = await service.get_messages(chat.id)
        assert total == 2

    async def test_get_message_count(self, service: ChatService):
        chat = await service.create_chat("Chat")
        await service.create_message(chat.id, "user", "Msg 1")
        await service.create_message(chat.id, "user", "Msg 2")
        count = await service.get_message_count(chat.id)
        assert count == 2
