import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.chat_service import ChatService
from app.models.tables import User, Chat, Message
from fastapi import HTTPException

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.fixture
def mock_user():
    return User(id=1, email="test@example.com", name="Test User")

@pytest.fixture
def chat_service(mock_db, mock_user):
    return ChatService(mock_db, mock_user)

@pytest.mark.asyncio
async def test_create_chat(chat_service, mock_db):
    # Arrange
    title = "Test Chat"
    
    # Act
    chat = await chat_service.create_chat(title)
    
    # Assert
    assert chat.title == title
    assert chat.user_id == chat_service.user.id
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_get_chat_success(chat_service, mock_db):
    # Arrange
    chat_id = 1
    mock_chat = Chat(id=chat_id, user_id=1, title="Test Chat")
    
    # Mock database execution result
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_chat
    mock_db.execute.return_value = mock_result
    
    # Act
    chat = await chat_service.get_chat(chat_id)
    
    # Assert
    assert chat.id == chat_id
    assert chat.title == "Test Chat"

@pytest.mark.asyncio
async def test_get_chat_not_found(chat_service, mock_db):
    # Arrange
    chat_id = 999
    
    # Mock database execution result (None)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await chat_service.get_chat(chat_id)
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_get_chat_forbidden(chat_service, mock_db):
    # Arrange
    chat_id = 2
    # Chat belongs to user 2, but service is initialized with user 1
    mock_chat = Chat(id=chat_id, user_id=2, title="Other User Chat")
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_chat
    mock_db.execute.return_value = mock_result
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await chat_service.get_chat(chat_id)
    assert exc.value.status_code == 403
