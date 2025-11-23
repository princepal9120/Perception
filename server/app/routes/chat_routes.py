"""
Chat routes for managing chat sessions and messages with streaming support.
"""
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tables import User, Chat
from app.models.schemas import (
    ChatCreate,
    ChatUpdate,
    ChatResponse,
    ChatListResponse,
    MessageCreate,
    MessageResponse,
    MessageListResponse,
    ErrorResponse,
    SuccessResponse
)
from app.services.chat_service import ChatService
from app.services.llm_client import LLMClient
from app.core.dependencies import get_current_active_user
from app.db.session import get_db


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chats", tags=["Chats"])

# Global LLM client (will be set in main.py)
llm_client: Optional[LLMClient] = None


def set_llm_client(client: LLMClient):
    """Set the global LLM client instance."""
    global llm_client
    llm_client = client


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        401: {"model": ErrorResponse}
    }
)
async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new chat session.
    
    - **title**: Chat title/name
    
    Requires authentication.
    """
    service = ChatService(db, current_user)
    chat = await service.create_chat(chat_data.title)
    
    # Get message count
    message_count = await service.get_message_count(chat.id)
    
    response = ChatResponse(
        id=chat.id,
        user_id=chat.user_id,
        title=chat.title,
        checkpoint_id=chat.checkpoint_id,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        message_count=message_count
    )
    
    return response


@router.get(
    "",
    response_model=ChatListResponse,
    responses={
        401: {"model": ErrorResponse}
    }
)
async def list_chats(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all chats for the current user.
    
    Returns chats sorted by most recently updated first.
    Requires authentication.
    """
    service = ChatService(db, current_user)
    chats, total = await service.get_user_chats(skip, limit)
    
    # Convert to response format with message counts
    chat_responses = []
    for chat in chats:
        message_count = await service.get_message_count(chat.id)
        chat_responses.append(
            ChatResponse(
                id=chat.id,
                user_id=chat.user_id,
                title=chat.title,
                checkpoint_id=chat.checkpoint_id,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                message_count=message_count
            )
        )
    
    return ChatListResponse(
        chats=chat_responses,
        total=total
    )


@router.get(
    "/{chat_id}",
    response_model=ChatResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific chat.
    
    Requires authentication and ownership of the chat.
    """
    service = ChatService(db, current_user)
    chat = await service.get_chat(chat_id)
    
    message_count = await service.get_message_count(chat.id)
    
    return ChatResponse(
        id=chat.id,
        user_id=chat.user_id,
        title=chat.title,
        checkpoint_id=chat.checkpoint_id,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        message_count=message_count
    )


@router.patch(
    "/{chat_id}",
    response_model=ChatResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def update_chat(
    chat_id: int,
    chat_data: ChatUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a chat's details.
    
    - **title**: New chat title (optional)
    
    Requires authentication and ownership of the chat.
    """
    service = ChatService(db, current_user)
    chat = await service.update_chat(chat_id, chat_data.title)
    
    message_count = await service.get_message_count(chat.id)
    
    return ChatResponse(
        id=chat.id,
        user_id=chat.user_id,
        title=chat.title,
        checkpoint_id=chat.checkpoint_id,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        message_count=message_count
    )


@router.delete(
    "/{chat_id}",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a chat and all its messages.
    
    This action is irreversible!
    Requires authentication and ownership of the chat.
    """
    service = ChatService(db, current_user)
    await service.delete_chat(chat_id)
    
    return SuccessResponse(
        message="Chat deleted successfully",
        data={"chat_id": chat_id}
    )


@router.get(
    "/{chat_id}/messages",
    response_model=MessageListResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def get_messages(
    chat_id: int,
    skip: int = Query(0, ge=0, description="Number of messages to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of messages"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get messages for a chat.
    
    Messages are returned in chronological order (oldest first).
    Uses Redis cache when available for better performance.
    Requires authentication and ownership of the chat.
    """
    service = ChatService(db, current_user)
    messages, total = await service.get_messages(chat_id, skip, limit)
    
    # Convert to response format
    message_responses = [
        MessageResponse(
            id=msg.id,
            chat_id=msg.chat_id,
            user_id=msg.user_id,
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at,
            metadata=json.loads(msg.metadata_json) if msg.metadata_json else None
        )
        for msg in messages
    ]
    
    return MessageListResponse(
        messages=message_responses,
        total=total,
        chat_id=chat_id
    )


@router.post(
    "/{chat_id}/message",
    responses={
        200: {"description": "Streaming response with SSE"},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse}
    }
)
async def send_message(
    chat_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in a chat and get AI response via streaming.
    
    - **content**: Message content
    
    Returns a streaming response with Server-Sent Events (SSE) containing:
    - `checkpoint`: LangGraph checkpoint ID (for first message)
    - `content`: Streamed AI response content
    - `tool_output`: Tool execution results
    - `search_start`: Search operation started
    - `search_results`: Search results with URLs
    - `end`: Stream completion
    - `error`: Error occurred
    
    Rate limited to 20 messages per minute per user.
    Requires authentication and ownership of the chat.
    """
    if not llm_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service not available"
        )
    
    service = ChatService(db, current_user)
    
    # Check rate limit
    await service.check_rate_limit()
    
    # Verify chat exists and user owns it
    chat = await service.get_chat(chat_id)
    
    # Save user message to database with document context
    user_message = await service.create_message_with_docs(
        chat_id=chat_id,
        role="user",
        content=message_data.content
    )
    
    # Get document context for LLM
    documents = await service.get_chat_documents(chat_id)
    document_context = {
        'has_documents': len(documents) > 0,
        'document_count': len(documents),
        'document_names': [doc.filename for doc in documents] if documents else [],
        'document_ids': [doc.id for doc in documents] if documents else []
    }
    
    # Store checkpoint info before streaming
    current_checkpoint = chat.checkpoint_id
    user_id = current_user.id
    
    logger.info(f"User {user_id} sent message in chat {chat_id} with {len(documents)} documents")
    
    # IMPORTANT: Close the current DB session before streaming
    # The streaming response will create new sessions as needed
    await db.close()
    
    # Stream AI response
    async def generate_response():
        """Generator for streaming AI responses."""
        from app.db.session import AsyncSessionLocal
        
        assistant_content = []
        new_checkpoint = None
        
        try:
            # Stream from LLM with document context
            async for event in llm_client.stream_chat_response(
                message_data.content,
                current_checkpoint,
                document_context,
                chat_id=chat_id
            ):
                yield event
                
                # Collect assistant content
                if '"type":"content"' in event:
                    try:
                        event_data = json.loads(event.replace("data: ", ""))
                        if event_data.get("type") == "content":
                            assistant_content.append(event_data.get("content", ""))
                    except:
                        pass
                
                # Collect checkpoint_id if new conversation
                if '"type":"checkpoint"' in event and not current_checkpoint:
                    try:
                        event_data = json.loads(event.replace("data: ", ""))
                        if event_data.get("type") == "checkpoint":
                            new_checkpoint = event_data.get("checkpoint_id")
                    except:
                        pass
            
            # After streaming completes, save to database with a NEW session
            # This prevents holding connections during streaming
            if assistant_content or new_checkpoint:
                async with AsyncSessionLocal() as session:
                    try:
                        # Update checkpoint if new
                        if new_checkpoint and not current_checkpoint:
                            from app.models.tables import Chat
                            result = await session.execute(
                                select(Chat).where(Chat.id == chat_id)
                            )
                            chat_obj = result.scalar_one_or_none()
                            if chat_obj:
                                chat_obj.checkpoint_id = new_checkpoint
                                logger.info(f"Updated chat {chat_id} with checkpoint {new_checkpoint}")
                        
                        # Save assistant response
                        if assistant_content:
                            from app.models.tables import Message, User
                            full_content = "".join(assistant_content)
                            
                            # Get user object
                            result = await session.execute(
                                select(User).where(User.id == user_id)
                            )
                            user_obj = result.scalar_one()
                            
                            message = Message(
                                chat_id=chat_id,
                                user_id=user_id,
                                role="assistant",
                                content=full_content
                            )
                            session.add(message)
                            logger.info(f"Assistant response saved for chat {chat_id}")
                        
                        await session.commit()
                        
                    except Exception as e:
                        await session.rollback()
                        logger.error(f"Error saving after stream: {e}")
                    finally:
                        await session.close()
                
        except Exception as e:
            logger.error(f"Error in generate_response: {e}")
            error_msg = str(e).replace('"', '\\"')
            yield f'data: {{"type":"error","message":"{error_msg}"}}\n\n'
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering for nginx
        }
    )
