"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from app.core.config import settings
import re


# ==================== Auth Schemas ====================

class UserSignup(BaseModel):
    """Schema for user signup request."""
    username: str = Field(..., min_length=settings.MIN_USERNAME_LENGTH, max_length=settings.MAX_USERNAME_LENGTH)
    email: EmailStr
    password: str = Field(..., min_length=settings.MIN_PASSWORD_LENGTH, max_length=settings.MAX_PASSWORD_LENGTH)
    
    @validator("username")
    def validate_username(cls, v):
        """Validate username format."""
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v
    
    @validator("password")
    def validate_password(cls, v):
        """Validate password strength."""
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Chat Schemas ====================

class ChatCreate(BaseModel):
    """Schema for creating a new chat."""
    title: str = Field(..., min_length=1, max_length=255)


class ChatUpdate(BaseModel):
    """Schema for updating a chat."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)


class ChatResponse(BaseModel):
    """Schema for chat response."""
    id: int
    user_id: int
    title: str
    checkpoint_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    """Schema for list of chats."""
    chats: List[ChatResponse]
    total: int


# ==================== Message Schemas ====================

class MessageCreate(BaseModel):
    """Schema for creating a new message."""
    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    chat_id: int
    user_id: int
    role: str
    content: str
    created_at: datetime
    metadata: Optional[dict] = None
    
    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema for list of messages."""
    messages: List[MessageResponse]
    total: int
    chat_id: int


# ==================== Stream Schemas ====================

class StreamEvent(BaseModel):
    """Schema for streaming events."""
    type: str  # 'checkpoint', 'content', 'tool_output', 'search_start', 'search_results', 'end', 'error'
    data: Optional[dict] = None
    content: Optional[str] = None


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Schema for success responses."""
    message: str
    data: Optional[dict] = None
