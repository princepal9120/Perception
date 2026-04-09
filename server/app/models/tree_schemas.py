"""
Pydantic schemas for conversation tree operations.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# ==================== Node Schemas ====================


class NodeMetadata(BaseModel):
    """Metadata stored with each node."""

    model: str | None = None
    tokens_used: int | None = None
    tools_used: list[str] | None = None
    search_queries: list[str] | None = None
    temperature: float | None = None
    custom_data: dict[str, Any] | None = None


class ConversationNodeCreate(BaseModel):
    """Schema for creating a new conversation node."""

    parent_id: str | None = None
    user_message: str | None = None
    ai_message: str | None = None
    metadata: NodeMetadata | None = None
    branch_name: str | None = None


class ConversationNodeResponse(BaseModel):
    """Schema for conversation node response."""

    id: str
    conversation_id: int
    parent_id: str | None
    depth: int
    user_message: str | None
    ai_message: str | None
    metadata: dict[str, Any] | None
    branch_name: str | None
    is_active: bool
    user_id: int
    checkpoint_id: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationNodeUpdate(BaseModel):
    """Schema for updating a node."""

    user_message: str | None = None
    ai_message: str | None = None
    metadata: NodeMetadata | None = None
    branch_name: str | None = None
    is_active: bool | None = None


# ==================== Tree Schemas ====================


class ConversationTreeResponse(BaseModel):
    """Schema for conversation tree metadata."""

    id: int
    chat_id: int
    user_id: int
    root_node_id: str
    active_node_id: str
    total_nodes: int
    total_branches: int
    max_depth: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreeNodeData(BaseModel):
    """Simplified node data for tree visualization."""

    id: str
    parent_id: str | None
    depth: int
    user_message: str | None
    ai_message: str | None
    branch_name: str | None
    is_active: bool
    created_at: datetime
    children_count: int = 0
    metadata: dict[str, Any] | None = None


class ConversationTreeStructure(BaseModel):
    """Complete tree structure for visualization."""

    tree_metadata: ConversationTreeResponse
    nodes: list[TreeNodeData]
    adjacency_list: dict[str, list[str]]  # parent_id -> [child_ids]


# ==================== Branch Operation Schemas ====================


class BranchCreateRequest(BaseModel):
    """Request to create a new branch from a node."""

    node_id: str = Field(..., description="Node ID to branch from")
    branch_name: str | None = Field(None, description="Custom branch name")


class BranchCreateResponse(BaseModel):
    """Response after creating a branch."""

    new_node: ConversationNodeResponse
    branch_name: str
    message: str


class MessageSendRequest(BaseModel):
    """Request to send a message in the tree."""

    node_id: str = Field(..., description="Parent node ID to send message from")
    message: str = Field(..., min_length=1, max_length=10000)
    regenerate: bool = Field(default=False, description="If true, creates a sibling node instead of a child")


class MessageSendResponse(BaseModel):
    """Response after sending a message."""

    user_node: ConversationNodeResponse
    ai_node: ConversationNodeResponse
    lineage: list[str]  # List of node IDs from root to current


class NodeLineageResponse(BaseModel):
    """Response containing node lineage (path from root)."""

    node_id: str
    lineage: list[ConversationNodeResponse]
    depth: int


class NodeChildrenResponse(BaseModel):
    """Response containing a node's children."""

    node_id: str
    children: list[ConversationNodeResponse]
    total_children: int


class TreeStatistics(BaseModel):
    """Statistics about the conversation tree."""

    total_nodes: int
    total_branches: int
    max_depth: int
    total_user_messages: int
    total_ai_messages: int
    branch_points: int  # Nodes with multiple children
    leaf_nodes: int  # Nodes with no children


# ==================== Navigation Schemas ====================


class SetActiveNodeRequest(BaseModel):
    """Request to set the active node."""

    node_id: str


class CompareNodesRequest(BaseModel):
    """Request to compare multiple nodes."""

    node_ids: list[str] = Field(..., min_length=2, max_length=10)


class CompareNodesResponse(BaseModel):
    """Response comparing multiple nodes."""

    nodes: list[ConversationNodeResponse]
    common_ancestor_id: str | None
    comparison_metadata: dict[str, Any]


# ==================== Migration Schema ====================


class MigrateToTreeRequest(BaseModel):
    """Request to migrate existing linear chat to tree structure."""

    chat_id: int
    preserve_messages: bool = Field(default=True, description="Keep original messages table intact")


class MigrateToTreeResponse(BaseModel):
    """Response after migrating to tree structure."""

    tree: ConversationTreeResponse
    nodes_created: int
    root_node_id: str
    message: str
