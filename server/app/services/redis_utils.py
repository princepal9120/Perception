"""
Redis utilities for caching and rate limiting using Upstash REST API.
"""

import json
import logging
from typing import Any

from upstash_redis import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Upstash Redis client wrapper for chat caching and rate limiting."""

    def __init__(self):
        """Initialize Redis client."""
        self.client: Redis | None = None
        self.connected = False

    async def connect(self):
        """Establish connection to Upstash Redis."""
        try:
            if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
                logger.warning("❌ Upstash Redis credentials not configured")
                self.connected = False
                return

            self.client = Redis(url=settings.UPSTASH_REDIS_REST_URL, token=settings.UPSTASH_REDIS_REST_TOKEN)
            # Test connection
            self.client.ping()
            self.connected = True
            logger.info("✅ Upstash Redis connection established")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Upstash Redis: {e}")
            logger.warning("❌ Running without Redis cache")
            self.connected = False

    async def disconnect(self):
        """Close Redis connection (no-op for Upstash REST)."""
        self.connected = False
        logger.info("✅ Upstash Redis connection closed")

    # ==================== Cache Operations ====================

    async def set(self, key: str, value: Any, expire: int | None = None) -> bool:
        """
        Set a value in Redis with optional expiration.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            expire: Optional expiration time in seconds

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            serialized = json.dumps(value)
            if expire:
                self.client.setex(key, expire, serialized)
            else:
                self.client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False

    async def get(self, key: str) -> Any | None:
        """
        Get a value from Redis.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if not self.connected:
            return None

        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def delete(self, key: str) -> bool:
        """
        Delete a key from Redis.

        Args:
            key: Cache key

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in Redis.

        Args:
            key: Cache key

        Returns:
            bool: True if key exists, False otherwise
        """
        if not self.connected:
            return False

        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False

    # ==================== List Operations ====================

    async def lpush(self, key: str, *values: Any) -> bool:
        """
        Push values to the left of a list.

        Args:
            key: List key
            values: Values to push (will be JSON serialized)

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            serialized = [json.dumps(v) for v in values]
            self.client.lpush(key, *serialized)
            return True
        except Exception as e:
            logger.error(f"Redis LPUSH error for key {key}: {e}")
            return False

    async def rpush(self, key: str, *values: Any) -> bool:
        """
        Push values to the right of a list.

        Args:
            key: List key
            values: Values to push (will be JSON serialized)

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            serialized = [json.dumps(v) for v in values]
            self.client.rpush(key, *serialized)
            return True
        except Exception as e:
            logger.error(f"Redis RPUSH error for key {key}: {e}")
            return False

    async def lrange(self, key: str, start: int = 0, end: int = -1) -> list[Any]:
        """
        Get a range of values from a list.

        Args:
            key: List key
            start: Start index
            end: End index (-1 for all)

        Returns:
            List of values
        """
        if not self.connected:
            return []

        try:
            values = self.client.lrange(key, start, end)
            return [json.loads(v) for v in values if v]
        except Exception as e:
            logger.error(f"Redis LRANGE error for key {key}: {e}")
            return []

    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """
        Trim a list to the specified range.

        Args:
            key: List key
            start: Start index
            end: End index

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            self.client.ltrim(key, start, end)
            return True
        except Exception as e:
            logger.error(f"Redis LTRIM error for key {key}: {e}")
            return False

    # ==================== Rate Limiting ====================

    async def check_rate_limit(self, user_id: int, limit: int, window: int) -> tuple[bool, int]:
        """
        Check if user has exceeded rate limit.

        Args:
            user_id: User ID
            limit: Maximum number of requests allowed
            window: Time window in seconds

        Returns:
            Tuple of (allowed, remaining): allowed is True if under limit, remaining is count left
        """
        if not self.connected:
            return True, limit  # Allow if Redis is down

        try:
            key = f"rate_limit:user:{user_id}"

            # Increment counter
            count = self.client.incr(key)

            # Set expiration on first request
            if count == 1:
                self.client.expire(key, window)

            allowed = count <= limit
            remaining = max(0, limit - count)

            return allowed, remaining
        except Exception as e:
            logger.error(f"Redis rate limit error for user {user_id}: {e}")
            return True, limit  # Allow if error

    async def get_rate_limit_ttl(self, user_id: int) -> int:
        """
        Get TTL (time to live) for rate limit key.

        Args:
            user_id: User ID

        Returns:
            TTL in seconds, or 0 if key doesn't exist
        """
        if not self.connected:
            return 0

        try:
            key = f"rate_limit:user:{user_id}"
            ttl = self.client.ttl(key)
            return max(0, ttl)
        except Exception as e:
            logger.error(f"Redis TTL error for user {user_id}: {e}")
            return 0

    # ==================== Session Cache ====================

    def get_session_key(self, chat_id: int) -> str:
        """Get Redis key for chat session messages."""
        return f"session:{chat_id}:messages"

    def get_user_sessions_key(self, user_id: int) -> str:
        """Get Redis key for user's session list."""
        return f"user:{user_id}:sessions"

    async def cache_messages(self, chat_id: int, messages: list[dict], max_messages: int = 100) -> bool:
        """
        Cache chat messages in Redis.

        Args:
            chat_id: Chat ID
            messages: List of message dicts
            max_messages: Maximum messages to cache

        Returns:
            bool: True if successful, False otherwise
        """
        key = self.get_session_key(chat_id)

        # Clear existing messages
        await self.delete(key)

        # Add new messages
        if messages:
            success = await self.rpush(key, *messages)
            if success:
                # Trim to max messages
                await self.ltrim(key, -max_messages, -1)
                # Set expiration
                self.client.expire(key, settings.SESSION_CACHE_TTL)
            return success
        return True

    async def get_cached_messages(self, chat_id: int) -> list[dict]:
        """
        Get cached messages for a chat.

        Args:
            chat_id: Chat ID

        Returns:
            List of message dicts
        """
        key = self.get_session_key(chat_id)
        return await self.lrange(key, 0, -1)

    async def add_message_to_cache(self, chat_id: int, message: dict) -> bool:
        """
        Add a single message to the cache.

        Args:
            chat_id: Chat ID
            message: Message dict

        Returns:
            bool: True if successful, False otherwise
        """
        key = self.get_session_key(chat_id)
        success = await self.rpush(key, message)
        if success:
            # Trim to max messages
            await self.ltrim(key, -settings.CACHE_MAX_MESSAGES, -1)
            # Refresh expiration
            self.client.expire(key, settings.SESSION_CACHE_TTL)
        return success

    async def add_user_session(self, user_id: int, chat_id: int) -> bool:
        """
        Add a chat session to user's session list.

        Args:
            user_id: User ID
            chat_id: Chat ID

        Returns:
            bool: True if successful, False otherwise
        """
        key = self.get_user_sessions_key(user_id)
        return await self.rpush(key, chat_id)

    async def get_user_sessions(self, user_id: int) -> list[int]:
        """
        Get user's session list.

        Args:
            user_id: User ID

        Returns:
            List of chat IDs
        """
        key = self.get_user_sessions_key(user_id)
        return await self.lrange(key, 0, -1)

    async def remove_user_session(self, user_id: int, chat_id: int) -> bool:
        """
        Remove a chat session from user's session list.

        Args:
            user_id: User ID
            chat_id: Chat ID

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connected:
            return False

        try:
            key = self.get_user_sessions_key(user_id)
            self.client.lrem(key, 0, json.dumps(chat_id))
            return True
        except Exception as e:
            logger.error(f"Redis LREM error for key {key}: {e}")
            return False


# Global Redis client instance
redis_client = RedisClient()
