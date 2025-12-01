"""
Service for managing conversation tree operations.
Handles branching, traversal, and tree manipulation.
"""
import json
import logging
from typing import List, Optional, Dict, Tuple, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, and_, or_
from fastapi import HTTPException, status

from app.models.conversation_tree import ConversationNode, ConversationTree, NodeRelationship
from app.models.tables import Chat, Message, User
from app.models.tree_schemas import (
    NodeMetadata,
    ConversationNodeResponse,
    TreeNodeData,
    ConversationTreeStructure,
    TreeStatistics
)
from app.services.redis_utils import redis_client

logger = logging.getLogger(__name__)


class TreeService:
    """Service for conversation tree operations."""
    
    def __init__(self, db: AsyncSession, user: User):
        """
        Initialize tree service.
        
        Args:
            db: Database session
            user: Current authenticated user
        """
        self.db = db
        self.user = user
    
    # ==================== Tree Creation & Initialization ====================
    
    async def create_tree_for_chat(self, chat_id: int) -> ConversationTree:
        """
        Create a new conversation tree for a chat.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Created conversation tree
        """
        # Verify chat exists and user owns it
        chat = await self._verify_chat_access(chat_id)
        
        # Check if tree already exists
        existing_tree = await self.db.execute(
            select(ConversationTree).where(ConversationTree.chat_id == chat_id)
        )
        if existing_tree.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tree already exists for this chat"
            )
        
        # Create root node
        root_node = ConversationNode(
            conversation_id=chat_id,
            parent_id=None,
            depth=0,
            user_id=self.user.id,
            branch_name="Main",
            is_active=True
        )
        
        self.db.add(root_node)
        await self.db.flush()
        
        # Create tree metadata
        tree = ConversationTree(
            chat_id=chat_id,
            user_id=self.user.id,
            root_node_id=root_node.id,
            active_node_id=root_node.id,
            total_nodes=1,
            total_branches=1,
            max_depth=0
        )
        
        self.db.add(tree)
        await self.db.commit()
        await self.db.refresh(tree)
        
        logger.info(f"Created conversation tree for chat {chat_id}")
        return tree
    
    async def get_or_create_tree(self, chat_id: int) -> ConversationTree:
        """
        Get existing tree or create new one.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Conversation tree
        """
        result = await self.db.execute(
            select(ConversationTree).where(ConversationTree.chat_id == chat_id)
        )
        tree = result.scalar_one_or_none()
        
        if not tree:
            tree = await self.create_tree_for_chat(chat_id)
        
        return tree
    
    # ==================== Node Operations ====================
    
    async def create_node(
        self,
        chat_id: int,
        parent_id: Optional[str] = None,
        user_message: Optional[str] = None,
        ai_message: Optional[str] = None,
        metadata: Optional[NodeMetadata] = None,
        branch_name: Optional[str] = None,
        checkpoint_id: Optional[str] = None
    ) -> ConversationNode:
        """
        Create a new node in the conversation tree.
        
        Args:
            chat_id: Chat ID
            parent_id: Parent node ID (None for root)
            user_message: User's message
            ai_message: AI's response
            metadata: Node metadata
            branch_name: Branch name
            checkpoint_id: LangGraph checkpoint ID
            
        Returns:
            Created node
        """
        tree = await self.get_or_create_tree(chat_id)
        
        # Determine depth
        depth = 0
        if parent_id:
            parent = await self.get_node(parent_id)
            depth = parent.depth + 1
            
            # Auto-generate branch name if not provided
            if not branch_name:
                siblings_count = await self._count_siblings(parent_id)
                if siblings_count == 0:
                    branch_name = parent.branch_name or "Main"
                else:
                    parent_branch = parent.branch_name or "Main"
                    branch_name = f"{parent_branch}.{siblings_count + 1}"
        else:
            branch_name = branch_name or "Main"
        
        # Create node
        node = ConversationNode(
            conversation_id=chat_id,
            parent_id=parent_id,
            depth=depth,
            user_message=user_message,
            ai_message=ai_message,
            metadata_json=json.dumps(metadata.model_dump()) if metadata else None,
            branch_name=branch_name,
            user_id=self.user.id,
            checkpoint_id=checkpoint_id,
            is_active=True
        )
        
        self.db.add(node)
        await self.db.flush()
        
        # Create relationship if has parent
        if parent_id:
            sibling_order = await self._count_siblings(parent_id)
            relationship = NodeRelationship(
                conversation_id=chat_id,
                parent_node_id=parent_id,
                child_node_id=node.id,
                sibling_order=sibling_order
            )
            self.db.add(relationship)
        
        # Update tree metadata
        tree.total_nodes += 1
        tree.max_depth = max(tree.max_depth, depth)
        tree.active_node_id = node.id
        tree.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(node)
        
        logger.info(f"Created node {node.id} in chat {chat_id}, depth {depth}")
        return node
    
    async def get_node(self, node_id: str) -> ConversationNode:
        """
        Get a node by ID.
        
        Args:
            node_id: Node ID
            
        Returns:
            Conversation node
            
        Raises:
            HTTPException: If node not found or access denied
        """
        result = await self.db.execute(
            select(ConversationNode).where(ConversationNode.id == node_id)
        )
        node = result.scalar_one_or_none()
        
        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node {node_id} not found"
            )
        
        if node.user_id != self.user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this node"
            )
        
        return node
    
    async def update_node(
        self,
        node_id: str,
        user_message: Optional[str] = None,
        ai_message: Optional[str] = None,
        metadata: Optional[NodeMetadata] = None,
        branch_name: Optional[str] = None
    ) -> ConversationNode:
        """
        Update a node's content.
        
        Args:
            node_id: Node ID
            user_message: Updated user message
            ai_message: Updated AI message
            metadata: Updated metadata
            branch_name: Updated branch name
            
        Returns:
            Updated node
        """
        node = await self.get_node(node_id)
        
        if user_message is not None:
            node.user_message = user_message
        if ai_message is not None:
            node.ai_message = ai_message
        if metadata is not None:
            node.metadata_json = json.dumps(metadata.model_dump())
        if branch_name is not None:
            node.branch_name = branch_name
        
        node.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(node)
        
        return node
    
    # ==================== Tree Traversal ====================
    
    async def get_lineage(self, node_id: str) -> List[ConversationNode]:
        """
        Get the lineage (path from root to node).
        
        Args:
            node_id: Node ID
            
        Returns:
            List of nodes from root to specified node
        """
        lineage = []
        current_node = await self.get_node(node_id)
        
        while current_node:
            lineage.insert(0, current_node)
            if current_node.parent_id:
                current_node = await self.get_node(current_node.parent_id)
            else:
                break
        
        return lineage
    
    async def get_children(self, node_id: str) -> List[ConversationNode]:
        """
        Get all children of a node.
        
        Args:
            node_id: Parent node ID
            
        Returns:
            List of child nodes
        """
        # Verify access
        await self.get_node(node_id)
        
        result = await self.db.execute(
            select(ConversationNode)
            .where(ConversationNode.parent_id == node_id)
            .order_by(ConversationNode.created_at.asc())
        )
        
        return result.scalars().all()
    
    async def get_siblings(self, node_id: str) -> List[ConversationNode]:
        """
        Get all siblings of a node (nodes with same parent).
        
        Args:
            node_id: Node ID
            
        Returns:
            List of sibling nodes (excluding the node itself)
        """
        node = await self.get_node(node_id)
        
        if not node.parent_id:
            return []  # Root has no siblings
        
        result = await self.db.execute(
            select(ConversationNode)
            .where(
                and_(
                    ConversationNode.parent_id == node.parent_id,
                    ConversationNode.id != node_id
                )
            )
            .order_by(ConversationNode.created_at.asc())
        )
        
        return result.scalars().all()
    
    async def get_tree_structure(self, chat_id: int) -> ConversationTreeStructure:
        """
        Get the complete tree structure for visualization.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Complete tree structure
        """
        tree = await self.get_or_create_tree(chat_id)
        
        # Get all nodes
        result = await self.db.execute(
            select(ConversationNode)
            .where(ConversationNode.conversation_id == chat_id)
            .order_by(ConversationNode.depth.asc(), ConversationNode.created_at.asc())
        )
        nodes = result.scalars().all()
        
        # Build adjacency list
        adjacency_list: Dict[str, List[str]] = {}
        node_data_list: List[TreeNodeData] = []
        
        for node in nodes:
            # Count children
            children_count = await self._count_children(node.id)
            
            # Parse metadata
            metadata = None
            if node.metadata_json:
                try:
                    metadata = json.loads(node.metadata_json)
                except:
                    pass

            # Create node data
            node_data = TreeNodeData(
                id=node.id,
                parent_id=node.parent_id,
                depth=node.depth,
                user_message=node.user_message,
                ai_message=node.ai_message,
                branch_name=node.branch_name,
                is_active=node.is_active,
                created_at=node.created_at,
                children_count=children_count,
                metadata=metadata
            )
            node_data_list.append(node_data)
            
            # Build adjacency list
            if node.parent_id:
                if node.parent_id not in adjacency_list:
                    adjacency_list[node.parent_id] = []
                adjacency_list[node.parent_id].append(node.id)
        
        from app.models.tree_schemas import ConversationTreeResponse
        
        tree_response = ConversationTreeResponse(
            id=tree.id,
            chat_id=tree.chat_id,
            user_id=tree.user_id,
            root_node_id=tree.root_node_id,
            active_node_id=tree.active_node_id,
            total_nodes=tree.total_nodes,
            total_branches=tree.total_branches,
            max_depth=tree.max_depth,
            created_at=tree.created_at,
            updated_at=tree.updated_at
        )
        
        return ConversationTreeStructure(
            tree_metadata=tree_response,
            nodes=node_data_list,
            adjacency_list=adjacency_list
        )
    
    # ==================== Branching Operations ====================
    
    async def fork_node(
        self,
        node_id: str,
        branch_name: Optional[str] = None
    ) -> ConversationNode:
        """
        Fork a node (create a copy as a sibling).
        
        Args:
            node_id: Node ID to fork
            branch_name: Custom branch name
            
        Returns:
            New forked node
        """
        original_node = await self.get_node(node_id)
        
        # Parse metadata
        metadata = None
        if original_node.metadata_json:
            metadata_dict = json.loads(original_node.metadata_json)
            metadata = NodeMetadata(**metadata_dict)
        
        # Create sibling node
        forked_node = await self.create_node(
            chat_id=original_node.conversation_id,
            parent_id=original_node.parent_id,
            user_message=original_node.user_message,
            ai_message=None,  # Don't copy AI response
            metadata=metadata,
            branch_name=branch_name
        )
        
        logger.info(f"Forked node {node_id} to create {forked_node.id}")
        return forked_node
    
    async def set_active_node(self, chat_id: int, node_id: str) -> ConversationTree:
        """
        Set the active node in the tree.
        
        Args:
            chat_id: Chat ID
            node_id: Node ID to set as active
            
        Returns:
            Updated tree
        """
        tree = await self.get_or_create_tree(chat_id)
        node = await self.get_node(node_id)
        
        if node.conversation_id != chat_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Node does not belong to this chat"
            )
        
        # Update all nodes to inactive
        await self.db.execute(
            select(ConversationNode)
            .where(ConversationNode.conversation_id == chat_id)
        )
        
        # Set lineage as active
        lineage = await self.get_lineage(node_id)
        for lineage_node in lineage:
            lineage_node.is_active = True
        
        tree.active_node_id = node_id
        tree.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(tree)
        
        return tree
    
    # ==================== Statistics ====================
    
    async def get_tree_statistics(self, chat_id: int) -> TreeStatistics:
        """
        Get statistics about the conversation tree.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Tree statistics
        """
        tree = await self.get_or_create_tree(chat_id)
        
        # Count nodes with user/AI messages
        result = await self.db.execute(
            select(
                func.count(ConversationNode.id).label('total'),
                func.sum(
                    func.case((ConversationNode.user_message.isnot(None), 1), else_=0)
                ).label('user_messages'),
                func.sum(
                    func.case((ConversationNode.ai_message.isnot(None), 1), else_=0)
                ).label('ai_messages')
            )
            .where(ConversationNode.conversation_id == chat_id)
        )
        stats = result.one()
        
        # Count branch points (nodes with multiple children)
        branch_points_result = await self.db.execute(
            select(func.count(func.distinct(NodeRelationship.parent_node_id)))
            .where(ConversationNode.conversation_id == chat_id)
            .select_from(NodeRelationship)
            .group_by(NodeRelationship.parent_node_id)
            .having(func.count(NodeRelationship.child_node_id) > 1)
        )
        branch_points = len(branch_points_result.all())
        
        # Count leaf nodes
        all_nodes_result = await self.db.execute(
            select(ConversationNode.id)
            .where(ConversationNode.conversation_id == chat_id)
        )
        all_node_ids = {row[0] for row in all_nodes_result.all()}
        
        parent_nodes_result = await self.db.execute(
            select(func.distinct(NodeRelationship.parent_node_id))
            .where(NodeRelationship.conversation_id == chat_id)
        )
        parent_node_ids = {row[0] for row in parent_nodes_result.all()}
        
        leaf_nodes = len(all_node_ids - parent_node_ids)
        
        return TreeStatistics(
            total_nodes=tree.total_nodes,
            total_branches=tree.total_branches,
            max_depth=tree.max_depth,
            total_user_messages=stats.user_messages or 0,
            total_ai_messages=stats.ai_messages or 0,
            branch_points=branch_points,
            leaf_nodes=leaf_nodes
        )
    
    # ==================== Migration ====================
    
    async def migrate_linear_chat_to_tree(self, chat_id: int) -> Tuple[ConversationTree, int]:
        """
        Migrate existing linear chat messages to tree structure.
        
        Args:
            chat_id: Chat ID
            
        Returns:
            Tuple of (tree, nodes_created)
        """
        # Verify chat access
        await self._verify_chat_access(chat_id)
        
        # Get existing messages
        result = await self.db.execute(
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.asc())
        )
        messages = result.scalars().all()
        
        if not messages:
            # Create empty tree
            tree = await self.create_tree_for_chat(chat_id)
            return tree, 0
        
        # Create tree
        tree = await self.create_tree_for_chat(chat_id)
        
        # Convert messages to nodes
        nodes_created = 0
        previous_node_id = tree.root_node_id
        
        logger.info(f"Starting migration of {len(messages)} messages for chat {chat_id}")
        
        # Group messages by pairs (user + AI)
        for i in range(0, len(messages), 2):
            user_msg = messages[i] if i < len(messages) and messages[i].role == 'user' else None
            ai_msg = messages[i + 1] if i + 1 < len(messages) and messages[i + 1].role == 'assistant' else None
            
            # Log what we're processing
            logger.info(f"Processing pair {i//2 + 1}: user={bool(user_msg)} ({user_msg.content[:30] if user_msg else 'None'}...), ai={bool(ai_msg)} ({ai_msg.content[:30] if ai_msg else 'None'}...)")
            
            # Skip if no valid pair
            if not user_msg and not ai_msg:
                logger.warning(f"Skipping invalid pair at index {i}")
                continue
            
            # Parse metadata
            metadata = None
            if ai_msg and ai_msg.metadata_json:
                try:
                    metadata_dict = json.loads(ai_msg.metadata_json)
                    metadata = NodeMetadata(**metadata_dict)
                except Exception as e:
                    logger.warning(f"Failed to parse metadata: {e}")
            
            # Create node
            node = await self.create_node(
                chat_id=chat_id,
                parent_id=previous_node_id if nodes_created > 0 else None,
                user_message=user_msg.content if user_msg else None,
                ai_message=ai_msg.content if ai_msg else None,
                metadata=metadata
            )
            
            logger.info(f"Created node {node.id} with depth={node.depth}, user_msg_len={len(user_msg.content) if user_msg else 0}, ai_msg_len={len(ai_msg.content) if ai_msg else 0}")
            
            previous_node_id = node.id
            nodes_created += 1
        
        logger.info(f"Migration complete: {len(messages)} messages → {nodes_created} nodes for chat {chat_id}")
        return tree, nodes_created
    
    # ==================== Helper Methods ====================
    
    async def _verify_chat_access(self, chat_id: int) -> Chat:
        """Verify user has access to chat."""
        result = await self.db.execute(
            select(Chat).where(Chat.id == chat_id)
        )
        chat = result.scalar_one_or_none()
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        if chat.user_id != self.user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat"
            )
        
        return chat
    
    async def _count_children(self, node_id: str) -> int:
        """Count children of a node."""
        result = await self.db.execute(
            select(func.count(ConversationNode.id))
            .where(ConversationNode.parent_id == node_id)
        )
        return result.scalar() or 0
    
    async def _count_siblings(self, parent_id: str) -> int:
        """Count siblings (children of same parent)."""
        result = await self.db.execute(
            select(func.count(ConversationNode.id))
            .where(ConversationNode.parent_id == parent_id)
        )
        return result.scalar() or 0
