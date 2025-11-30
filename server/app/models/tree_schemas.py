"""
Pydantic schemas for conversation tree operations.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ==================== Node Schemas ====================

class NodeMetadata(BaseModel):
    """Metadata stored with each node."""
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    tools_used: Optional[List[str]] = None
    search_queries: Optional[List[str]] = None
    temperature: Optional[float] = None
    custom_data: Optional[Dict[str, Any]] = None


class ConversationNodeCreate(BaseModel):
    """Schema for creating a new conversation node."""
    parent_id: Optional[str] = None
    user_message: Optional[str] = None
    ai_message: Optional[str] = None
    metadata: Optional[NodeMetadata] = None
    branch_name: Optional[str] = None


class ConversationNodeResponse(BaseModel):
    """Schema for conversation node response."""
    id: str
    conversation_id: int
    parent_id: Optional[str]
    depth: int
    user_message: Optional[str]
    ai_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    branch_name: Optional[str]
    is_active: bool
    user_id: int
    checkpoint_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConversationNodeUpdate(BaseModel):
    """Schema for updating a node."""
    user_message: Optional[str] = None
    ai_message: Optional[str] = None
    metadata: Optional[NodeMetadata] = None
    branch_name: Optional[str] = None
    is_active: Optional[bool] = None


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
    parent_id: Optional[str]
    depth: int
    user_message: Optional[str]
    ai_message: Optional[str]
    branch_name: Optional[str]
    is_active: bool
    created_at: datetime
    children_count: int = 0


class ConversationTreeStructure(BaseModel):
    """Complete tree structure for visualization."""
    tree_metadata: ConversationTreeResponse
    nodes: List[TreeNodeData]
    adjacency_list: Dict[str, List[str]]  # parent_id -> [child_ids]


# ==================== Branch Operation Schemas ====================

class BranchCreateRequest(BaseModel):
    """Request to create a new branch from a node."""
    node_id: str = Field(..., description="Node ID to branch from")
    branch_name: Optional[str] = Field(None, description="Custom branch name")


class BranchCreateResponse(BaseModel):
    """Response after creating a branch."""
    new_node: ConversationNodeResponse
    branch_name: str
    message: str


class MessageSendRequest(BaseModel):
    """Request to send a message in the tree."""
    node_id: str = Field(..., description="Parent node ID to send message from")
    message: str = Field(..., min_length=1, max_length=10000)
    regenerate: bool = Field(
        default=False,
        description="If true, creates a sibling node instead of a child"
    )


class MessageSendResponse(BaseModel):
    """Response after sending a message."""
    user_node: ConversationNodeResponse
    ai_node: ConversationNodeResponse
    lineage: List[str]  # List of node IDs from root to current


class NodeLineageResponse(BaseModel):
    """Response containing node lineage (path from root)."""
    node_id: str
    lineage: List[ConversationNodeResponse]
    depth: int


class NodeChildrenResponse(BaseModel):
    """Response containing a node's children."""
    node_id: str
    children: List[ConversationNodeResponse]
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
    node_ids: List[str] = Field(..., min_length=2, max_length=10)


class CompareNodesResponse(BaseModel):
    """Response comparing multiple nodes."""
    nodes: List[ConversationNodeResponse]
    common_ancestor_id: Optional[str]
    comparison_metadata: Dict[str, Any]


# ==================== Migration Schema ====================

class MigrateToTreeRequest(BaseModel):
    """Request to migrate existing linear chat to tree structure."""
    chat_id: int
    preserve_messages: bool = Field(
        default=True,
        description="Keep original messages table intact"
    )


class MigrateToTreeResponse(BaseModel):
    """Response after migrating to tree structure."""
    tree: ConversationTreeResponse
    nodes_created: int
    root_node_id: str
    message: str
