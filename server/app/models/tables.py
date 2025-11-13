"""
SQLModel database tables for users, chats, and messages.
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, Text, Index
from sqlalchemy.sql import func


class User(SQLModel, table=True):
    """User table for authentication."""
    
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=30)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    
    # Relationships
    chats: List["Chat"] = Relationship(back_populates="user", cascade_delete=True)
    messages: List["Message"] = Relationship(back_populates="user", cascade_delete=True)


class Chat(SQLModel, table=True):
    """Chat session table."""
    
    __tablename__ = "chats"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=255)
    checkpoint_id: Optional[str] = Field(default=None, max_length=255, index=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now()
        )
    )
    
    # Relationships
    user: User = Relationship(back_populates="chats")
    messages: List["Message"] = Relationship(back_populates="chat", cascade_delete=True)
    
    __table_args__ = (
        Index("ix_chats_user_created", "user_id", "created_at"),
    )


class Message(SQLModel, table=True):
    """Message table for chat history."""
    
    __tablename__ = "messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chats.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    role: str = Field(max_length=20)  # 'user', 'assistant', 'system', 'tool'
    content: str = Field(sa_column=Column(Text))
    metadata_json: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    
    # Relationships
    chat: Chat = Relationship(back_populates="messages")
    user: User = Relationship(back_populates="messages")
    
    __table_args__ = (
        Index("ix_messages_chat_created", "chat_id", "created_at"),
    )
