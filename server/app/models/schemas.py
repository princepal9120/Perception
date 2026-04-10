"""
Pydantic schemas for request/response validation.
"""

import re
from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import settings

# ==================== Auth Schemas ====================


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserSignup(BaseModel):
    """Schema for user signup request."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=settings.MIN_PASSWORD_LENGTH, max_length=settings.MAX_PASSWORD_LENGTH)

    @field_validator("password")
    @classmethod
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
    remember_me: bool = False


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


# ==================== Chat Schemas ====================


class ChatAnswer(BaseModel):
    """Validate chat answer type and length."""

    answer: Annotated[str, Field(min_length=1, max_length=4096)]


class PromptType(str, Enum):
    CONTEXTUALIZE_QUESTION = "contextualize_question"
    CONTEXT_QA = "context_qa"


class UploadResponse(BaseModel):
    session_id: str
    indexed: bool
    message: str | None = None


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatCreate(BaseModel):
    """Schema for creating a new chat."""

    title: str = Field(..., min_length=1, max_length=255)


class ChatUpdate(BaseModel):
    """Schema for updating a chat."""

    title: str | None = Field(None, min_length=1, max_length=255)


class ChatResponse(BaseModel):
    """Schema for chat response."""

    id: int
    user_id: int
    title: str
    checkpoint_id: str | None
    parent_chat_id: int | None = None
    branch_message_id: int | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int | None = None

    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    """Schema for list of chats."""

    chats: list[ChatResponse]
    total: int


# ==================== Message Schemas ====================


class MessageCreate(BaseModel):
    """Schema for creating a new message."""

    content: str = Field(..., min_length=1, max_length=10000)


class MessageFeedbackUpdate(BaseModel):
    """Schema for storing lightweight feedback on an assistant response."""

    liked: bool


class MessageResponse(BaseModel):
    """Schema for message response."""

    id: int
    chat_id: int
    user_id: int
    role: str
    content: str
    created_at: datetime
    metadata: dict | None = None

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema for list of messages."""

    messages: list[MessageResponse]
    total: int
    chat_id: int


# ==================== Stream Schemas ====================


class StreamEvent(BaseModel):
    """Schema for streaming events."""

    type: str  # 'checkpoint', 'content', 'tool_output', 'search_start', 'search_results', 'end', 'error'
    data: dict | None = None
    content: str | None = None


# ==================== Document Schemas ====================


class DocumentResponse(BaseModel):
    """Schema for document response."""

    id: int
    user_id: int
    chat_id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    file_extension: str
    session_id: str
    chunk_count: int
    indexed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for list of documents."""

    documents: list[DocumentResponse]
    total: int
    chat_id: int | None = None


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""

    documents: list[DocumentResponse]
    session_id: str
    indexed: bool
    message: str


class DocumentDeleteResponse(BaseModel):
    """Schema for document deletion response."""

    message: str
    document_id: int


# ==================== Error Schemas ====================


class ErrorResponse(BaseModel):
    """Schema for error responses."""

    detail: str
    error_code: str | None = None


class SuccessResponse(BaseModel):
    """Schema for success responses."""

    message: str
    data: dict | None = None
