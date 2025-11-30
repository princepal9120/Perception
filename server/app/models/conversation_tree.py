"""
Conversation Tree models for branchable LLM conversations.
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, Text, JSON, Index
from sqlalchemy.sql import func
import uuid


class ConversationNode(SQLModel, table=True):
    """
    Represents a single node in the conversation tree.
    Each node contains either a user message, AI response, or both.
    """
    
    __tablename__ = "conversation_nodes"
    
    # Primary identification
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36
    )
    
    # Tree structure
    conversation_id: int = Field(foreign_key="chats.id", index=True)
    parent_id: Optional[str] = Field(
        default=None,
        foreign_key="conversation_nodes.id",
        max_length=36,
        index=True
    )
    depth: int = Field(default=0, index=True)
    
    # Message content
    user_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    ai_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Metadata
    metadata_json: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="JSON metadata: tokens, model, tools used, etc."
    )
    
    # Branch information
    branch_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Human-readable branch name (e.g., 'Branch A', 'Branch A1')"
    )
    is_active: bool = Field(
        default=True,
        description="Whether this node is in the currently active branch"
    )
    
    # User tracking
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Timestamps
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
    
    # LangGraph checkpoint
    checkpoint_id: Optional[str] = Field(
        default=None,
        max_length=255,
        index=True,
        description="LangGraph checkpoint ID for this node"
    )
    
    __table_args__ = (
        Index("ix_nodes_conversation_depth", "conversation_id", "depth"),
        Index("ix_nodes_conversation_parent", "conversation_id", "parent_id"),
        Index("ix_nodes_user_created", "user_id", "created_at"),
    )


class ConversationTree(SQLModel, table=True):
    """
    Metadata about the conversation tree structure.
    Links to the Chat table for backward compatibility.
    """
    
    __tablename__ = "conversation_trees"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chats.id", unique=True, index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Tree metadata
    root_node_id: str = Field(
        foreign_key="conversation_nodes.id",
        max_length=36,
        description="ID of the root node"
    )
    active_node_id: str = Field(
        foreign_key="conversation_nodes.id",
        max_length=36,
        description="Currently active/selected node"
    )
    
    # Statistics
    total_nodes: int = Field(default=0)
    total_branches: int = Field(default=1)
    max_depth: int = Field(default=0)
    
    # Timestamps
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
    
    __table_args__ = (
        Index("ix_trees_user_created", "user_id", "created_at"),
    )


class NodeRelationship(SQLModel, table=True):
    """
    Explicit parent-child relationships for faster tree traversal.
    This is a denormalized table for performance optimization.
    """
    
    __tablename__ = "node_relationships"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="chats.id", index=True)
    parent_node_id: str = Field(
        foreign_key="conversation_nodes.id",
        max_length=36,
        index=True
    )
    child_node_id: str = Field(
        foreign_key="conversation_nodes.id",
        max_length=36,
        index=True
    )
    
    # For ordering siblings
    sibling_order: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    
    __table_args__ = (
        Index("ix_relationships_parent", "parent_node_id", "sibling_order"),
        Index("ix_relationships_child", "child_node_id"),
        Index("ix_relationships_conversation", "conversation_id"),
    )
