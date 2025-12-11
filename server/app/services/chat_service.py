"""
Chat service for managing chats and messages with caching and rate limiting.
"""
import json
import logging
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.models.tables import Chat, Message, User, Document
from app.models.schemas import MessageResponse
from app.services.redis_utils import redis_client
from app.core.config import settings
from fastapi import HTTPException, status
from sqlalchemy import select


logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat and message operations."""
    
    def __init__(self, db: AsyncSession, user: User):
        """
        Initialize chat service.
        
        Args:
            db: Database session
            user: Current authenticated user
        """
        self.db = db
        self.user = user
    
    # ==================== Chat Operations ====================
    
    async def create_chat(self, title: str) -> Chat:
        """
        Create a new chat session.
        
        Args:
            title: Chat title
            
        Returns:
            Created chat
        """
        chat = Chat(
            user_id=self.user.id,
            title=title
        )
        
        self.db.add(chat)
        await self.db.commit()
        await self.db.refresh(chat)
        
        # Add to user's session cache
        await redis_client.add_user_session(self.user.id, chat.id)
        
        logger.info(f"Created chat {chat.id} for user {self.user.id}")
        return chat
    
    async def get_user_chats(self, skip: int = 0, limit: int = 50) -> Tuple[List[Chat], int]:
        """
        Get all chats for the current user.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (chats, total_count)
        """
        # Get total count
        count_query = select(func.count(Chat.id)).where(Chat.user_id == self.user.id)
        total = await self.db.scalar(count_query)
        
        # Get chats
        query = (
            select(Chat)
            .where(Chat.user_id == self.user.id)
            .order_by(Chat.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        chats = result.scalars().all()
        
        return chats, total or 0
    
    async def get_chat(self, chat_id: int) -> Chat:
        """
        Get a specific chat by ID.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Chat instance
            
        Raises:
            HTTPException: If chat not found or access denied
        """
        result = await self.db.execute(
            select(Chat).where(Chat.id == chat_id)
        )
        chat = result.scalar_one_or_none()
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        # Check ownership
        if chat.user_id != self.user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat"
            )
        
        return chat
    
    async def update_chat(self, chat_id: int, title: Optional[str] = None) -> Chat:
        """
        Update a chat's details.
        
        Args:
            chat_id: Chat ID
            title: New title (optional)
            
        Returns:
            Updated chat
        """
        chat = await self.get_chat(chat_id)
        
        if title is not None:
            chat.title = title
        
        chat.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(chat)
        
        return chat
    
    async def delete_chat(self, chat_id: int) -> bool:
        """
        Delete a chat and all its messages.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            True if successful
        """
        chat = await self.get_chat(chat_id)
        
        # Delete from database (messages will cascade)
        await self.db.delete(chat)
        await self.db.commit()
        
        # Delete from cache
        await redis_client.delete(redis_client.get_session_key(chat_id))
        await redis_client.remove_user_session(self.user.id, chat_id)
        
        logger.info(f"Deleted chat {chat_id} for user {self.user.id}")
        return True
    
    # ==================== Message Operations ====================
    
    async def get_messages(
        self, 
        chat_id: int, 
        skip: int = 0, 
        limit: int = 100,
        use_cache: bool = True
    ) -> Tuple[List[Message], int]:
        """
        Get messages for a chat.
        
        Args:
            chat_id: Chat ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            use_cache: Whether to use Redis cache
            
        Returns:
            Tuple of (messages, total_count)
        """
        # Verify chat ownership
        await self.get_chat(chat_id)
        
        # Try cache first
        if use_cache:
            cached = await redis_client.get_cached_messages(chat_id)
            if cached:
                logger.info(f"Retrieved {len(cached)} messages from cache for chat {chat_id}")
                # Convert cached dicts to Message objects for consistency
                # Return cached data with estimated count
                return [], len(cached)  # We'll return the cache data differently
        
        # Get from database
        count_query = select(func.count(Message.id)).where(Message.chat_id == chat_id)
        total = await self.db.scalar(count_query)
        
        query = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        # Cache messages
        if use_cache and messages:
            message_dicts = [
                {
                    "id": msg.id,
                    "chat_id": msg.chat_id,
                    "user_id": msg.user_id,
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                    "metadata": json.loads(msg.metadata_json) if msg.metadata_json else None
                }
                for msg in messages
            ]
            await redis_client.cache_messages(chat_id, message_dicts)
        
        return messages, total or 0
    
    async def create_message(
        self, 
        chat_id: int, 
        role: str, 
        content: str,
        metadata: Optional[dict] = None
    ) -> Message:
        """
        Create a new message in a chat.
        
        Args:
            chat_id: Chat ID
            role: Message role ('user', 'assistant', 'system', 'tool')
            content: Message content
            metadata: Optional metadata JSON
            
        Returns:
            Created message
        """
        # Verify chat ownership
        chat = await self.get_chat(chat_id)
        
        # Create message
        message = Message(
            chat_id=chat_id,
            user_id=self.user.id,
            role=role,
            content=content,
            metadata_json=json.dumps(metadata) if metadata else None
        )
        
        self.db.add(message)
        
        # Update chat's updated_at
        chat.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(message)
        
        # Add to cache
        message_dict = {
            "id": message.id,
            "chat_id": message.chat_id,
            "user_id": message.user_id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "metadata": metadata
        }
        await redis_client.add_message_to_cache(chat_id, message_dict)
        
        logger.info(f"Created message {message.id} in chat {chat_id}")
        return message
    
    async def check_rate_limit(self) -> bool:
        """
        Check if user has exceeded rate limit for messages.
        
        Returns:
            True if under limit, False if exceeded
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        allowed, remaining = await redis_client.check_rate_limit(
            self.user.id,
            settings.RATE_LIMIT_MESSAGES_PER_MINUTE,
            settings.RATE_LIMIT_WINDOW_SECONDS
        )
        
        if not allowed:
            ttl = await redis_client.get_rate_limit_ttl(self.user.id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                headers={"Retry-After": str(ttl)}
            )
        
        logger.info(f"Rate limit check for user {self.user.id}: {remaining} remaining")
        return True
    
    async def get_message_count(self, chat_id: int) -> int:
        """
        Get total message count for a chat.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Total message count
        """
        query = select(func.count(Message.id)).where(Message.chat_id == chat_id)
        count = await self.db.scalar(query)
        return count or 0
    
    async def get_chat_documents(self, chat_id: int) -> List[Document]:
        """
        Get all documents for a chat.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            List of documents
        """
        # Verify chat ownership
        await self.get_chat(chat_id)
        
        query = (
            select(Document)
            .where(Document.chat_id == chat_id)
            .where(Document.indexed == True)
            .order_by(Document.created_at.desc())
        )
        
        result = await self.db.execute(query)
        documents = result.scalars().all()
        
        return documents
    
    async def create_message_with_docs(
        self, 
        chat_id: int, 
        role: str, 
        content: str,
        metadata: Optional[dict] = None
    ) -> Message:
        """
        Create a new message with document context.
        
        Args:
            chat_id: Chat ID
            role: Message role ('user', 'assistant', 'system', 'tool')
            content: Message content
            metadata: Optional metadata JSON
            
        Returns:
            Created message
        """
        # Get chat documents for context
        documents = await self.get_chat_documents(chat_id)
        
        # Add document info to metadata
        if metadata is None:
            metadata = {}
        
        metadata['has_documents'] = len(documents) > 0
        metadata['document_count'] = len(documents)
        if documents:
            metadata['document_names'] = [doc.filename for doc in documents]
            metadata['document_ids'] = [doc.id for doc in documents]
        
        # Create message with enhanced metadata
        return await self.create_message(chat_id, role, content, metadata)
    
    async def branch_from_message(self, chat_id: int, message_id: int) -> Chat:
        """
        Create a new chat branched from a specific message.
        
        Copies all messages from the original chat up to and including
        the specified message_id into a new chat.
        
        Args:
            chat_id: Original chat ID
            message_id: Message ID to branch from
            
        Returns:
            Newly created chat with copied messages
        """
        # Validate message_id is within valid int32 range
        # Temporary client IDs (Date.now()) are too large for the database
        MAX_INT32 = 2147483647
        if message_id > MAX_INT32 or message_id < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid message ID. Please refresh the chat and try again."
            )
        
        # Verify ownership of original chat
        original_chat = await self.get_chat(chat_id)
        
        # Get the message to branch from
        result = await self.db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.chat_id == chat_id
            )
        )
        branch_point = result.scalar_one_or_none()
        
        if not branch_point:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found in this chat"
            )
        
        # Create new branch chat with ChatGPT-style naming
        # Format: "Branch from: [original chat name]"
        branch_title = f"Branch from: {original_chat.title}"
        if len(branch_title) > 255:
            branch_title = branch_title[:252] + "..."
            
        new_chat = Chat(
            user_id=self.user.id,
            title=branch_title,
            parent_chat_id=chat_id,  # Track parent chat for workflow visualization
            branch_message_id=message_id  # Track which message we branched from
        )
        self.db.add(new_chat)
        await self.db.flush()  # Get the new chat ID
        
        # Get all messages up to and including the branch point
        query = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .where(Message.created_at <= branch_point.created_at)
            .order_by(Message.created_at.asc())
        )
        result = await self.db.execute(query)
        messages_to_copy = result.scalars().all()
        
        # Copy messages to new chat
        for msg in messages_to_copy:
            new_message = Message(
                chat_id=new_chat.id,
                user_id=self.user.id,
                role=msg.role,
                content=msg.content,
                metadata_json=msg.metadata_json
            )
            self.db.add(new_message)
        
        await self.db.commit()
        await self.db.refresh(new_chat)
        
        # Add to user's session cache
        await redis_client.add_user_session(self.user.id, new_chat.id)
        
        logger.info(f"Created branch chat {new_chat.id} from chat {chat_id} message {message_id} with {len(messages_to_copy)} messages")
        return new_chat
