# app/utils/session_manager.py
"""
Session management utilities for handling user sessions and JWT token tracking.
Provides in-memory session storage with optional database persistence.
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, Set
from dataclasses import dataclass, asdict
import asyncio
import logging

from ..core.config import settings

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class SessionData:
    """
    Data structure for user session information.
    
    Contains all relevant session data including user information,
    authentication status, and session metadata.
    """
    session_id: str
    user_id: int
    email: str
    is_authenticated: bool
    created_at: datetime
    last_accessed: datetime
    expires_at: datetime
    jwt_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if session is valid (not expired and authenticated)."""
        return self.is_authenticated and not self.is_expired()
    
    def update_access_time(self) -> None:
        """Update the last accessed timestamp."""
        self.last_accessed = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session data to dictionary."""
        data = asdict(self)
        # Convert datetime objects to ISO strings for JSON serialization
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SessionData':
        """Create SessionData from dictionary."""
        # Convert ISO strings back to datetime objects
        datetime_fields = ['created_at', 'last_accessed', 'expires_at']
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                data[field] = datetime.fromisoformat(data[field])
        
        return cls(**data)


class SessionManager:
    """
    In-memory session manager with optional persistence.
    
    Manages user sessions including creation, validation, cleanup,
    and JWT token tracking. Provides thread-safe operations for
    concurrent access in FastAPI applications.
    """
    
    def __init__(self, cleanup_interval: int = 300):  # 5 minutes
        """
        Initialize session manager.
        
        Args:
            cleanup_interval: Seconds between automatic cleanup runs
        """
        self._sessions: Dict[str, SessionData] = {}
        self._user_sessions: Dict[int, Set[str]] = {}  # user_id -> set of session_ids
        self._jwt_blacklist: Set[str] = set()  # Blacklisted JWT tokens
        self._cleanup_interval = cleanup_interval
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
    
    async def create_session(
        self,
        user_id: int,
        email: str,
        jwt_token: str,
        refresh_token: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        expires_in: Optional[int] = None
    ) -> SessionData:
        """
        Create a new user session.
        
        Args:
            user_id: User's unique identifier
            email: User's email address
            jwt_token: JWT access token
            refresh_token: Optional refresh token
            user_agent: User's browser/client agent
            ip_address: User's IP address
            expires_in: Session expiry in seconds (default: 1 hour)
            
        Returns:
            Created SessionData object
        """
        async with self._lock:
            session_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Default session expiry (1 hour)
            if expires_in is None:
                expires_in = 3600  # 1 hour
            
            session_data = SessionData(
                session_id=session_id,
                user_id=user_id,
                email=email,
                is_authenticated=True,
                created_at=now,
                last_accessed=now,
                expires_at=now + timedelta(seconds=expires_in),
                jwt_token=jwt_token,
                refresh_token=refresh_token,
                user_agent=user_agent,
                ip_address=ip_address
            )
            
            # Store session
            self._sessions[session_id] = session_data
            
            # Track user sessions
            if user_id not in self._user_sessions:
                self._user_sessions[user_id] = set()
            self._user_sessions[user_id].add(session_id)
            
            logger.info(f"Created session {session_id} for user {user_id}")
            return session_data
    
    async def get_session(self, session_id: str) -> Optional[SessionData]:
        """
        Get session by session ID.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionData if found and valid, None otherwise
        """
        async with self._lock:
            session = self._sessions.get(session_id)
            
            if session is None:
                return None
            
            if session.is_expired():
                await self._remove_session(session_id)
                return None
            
            # Update access time
            session.update_access_time()
            return session
    
    async def get_session_by_user_id(self, user_id: int) -> Optional[SessionData]:
        """
        Get the most recent valid session for a user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Most recent valid SessionData or None
        """
        async with self._lock:
            user_session_ids = self._user_sessions.get(user_id, set())
            
            # Find the most recent valid session
            latest_session = None
            latest_time = datetime.min
            
            for session_id in list(user_session_ids):  # Create list to avoid modification during iteration
                session = self._sessions.get(session_id)
                
                if session is None or session.is_expired():
                    # Clean up invalid session
                    user_session_ids.discard(session_id)
                    if session_id in self._sessions:
                        del self._sessions[session_id]
                    continue
                
                if session.last_accessed > latest_time:
                    latest_session = session
                    latest_time = session.last_accessed
            
            if latest_session:
                latest_session.update_access_time()
            
            return latest_session
    
    async def validate_jwt_token(self, jwt_token: str) -> bool:
        """
        Check if JWT token is valid (not blacklisted).
        
        Args:
            jwt_token: JWT token to validate
            
        Returns:
            True if token is valid, False if blacklisted
        """
        async with self._lock:
            return jwt_token not in self._jwt_blacklist
    
    async def blacklist_jwt_token(self, jwt_token: str) -> None:
        """
        Add JWT token to blacklist (for logout).
        
        Args:
            jwt_token: JWT token to blacklist
        """
        async with self._lock:
            self._jwt_blacklist.add(jwt_token)
            logger.info(f"Blacklisted JWT token: {jwt_token[:20]}...")
    
    async def invalidate_session(self, session_id: str) -> bool:
        """
        Invalidate a specific session.
        
        Args:
            session_id: Session identifier to invalidate
            
        Returns:
            True if session was found and invalidated, False otherwise
        """
        async with self._lock:
            session = self._sessions.get(session_id)
            
            if session is None:
                return False
            
            # Blacklist JWT token if present
            if session.jwt_token:
                self._jwt_blacklist.add(session.jwt_token)
            
            # Remove session
            await self._remove_session(session_id)
            
            logger.info(f"Invalidated session {session_id}")
            return True
    
    async def invalidate_user_sessions(self, user_id: int) -> int:
        """
        Invalidate all sessions for a specific user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Number of sessions invalidated
        """
        async with self._lock:
            user_session_ids = self._user_sessions.get(user_id, set()).copy()
            count = 0
            
            for session_id in user_session_ids:
                session = self._sessions.get(session_id)
                if session:
                    # Blacklist JWT token
                    if session.jwt_token:
                        self._jwt_blacklist.add(session.jwt_token)
                    count += 1
                
                await self._remove_session(session_id)
            
            logger.info(f"Invalidated {count} sessions for user {user_id}")
            return count
    
    async def _remove_session(self, session_id: str) -> None:
        """
        Internal method to remove session from storage.
        
        Args:
            session_id: Session identifier to remove
        """
        session = self._sessions.pop(session_id, None)
        
        if session:
            # Remove from user session tracking
            user_sessions = self._user_sessions.get(session.user_id, set())
            user_sessions.discard(session_id)
            
            # Clean up empty user session sets
            if not user_sessions:
                self._user_sessions.pop(session.user_id, None)
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired sessions and blacklisted tokens.
        
        Returns:
            Number of sessions cleaned up
        """
        async with self._lock:
            now = datetime.utcnow()
            expired_sessions = []
            
            # Find expired sessions
            for session_id, session in self._sessions.items():
                if session.is_expired():
                    expired_sessions.append(session_id)
            
            # Remove expired sessions
            for session_id in expired_sessions:
                await self._remove_session(session_id)
            
            # Clean up old blacklisted tokens (keep for 24 hours)
            # Note: In a production system, you might want to store blacklist
            # with timestamps and clean up based on JWT expiry times
            
            if expired_sessions:
                logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
            
            return len(expired_sessions)
    
    async def get_session_stats(self) -> Dict[str, Any]:
        """
        Get session manager statistics.
        
        Returns:
            Dictionary with session statistics
        """
        async with self._lock:
            active_sessions = sum(
                1 for session in self._sessions.values() 
                if session.is_valid()
            )
            
            return {
                "total_sessions": len(self._sessions),
                "active_sessions": active_sessions,
                "blacklisted_tokens": len(self._jwt_blacklist),
                "users_with_sessions": len(self._user_sessions),
            }
    
    async def start_cleanup_task(self) -> None:
        """Start the automatic cleanup task."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("Started session cleanup task")
    
    async def stop_cleanup_task(self) -> None:
        """Stop the automatic cleanup task."""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            logger.info("Stopped session cleanup task")
    
    async def _cleanup_loop(self) -> None:
        """Background task for periodic session cleanup."""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self.cleanup_expired_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in session cleanup: {e}")


# Global session manager instance
session_manager = SessionManager()