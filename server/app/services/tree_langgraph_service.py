"""
LangGraph integration for conversation tree.
Builds message history from tree lineage and manages streaming.
"""
import json
import logging
from typing import List, Dict, Any, AsyncGenerator, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation_tree import ConversationNode
from app.models.tables import User
from app.models.tree_schemas import NodeMetadata
from app.services.tree_service import TreeService
from app.services.llm_client import LLMClient
from app.core.config import settings
from app.prompts.prompt_library import get_prompt

logger = logging.getLogger(__name__)


class TreeLangGraphService:
    """Service for LangGraph integration with conversation trees."""
    
    def __init__(self, db: AsyncSession, user: User):
        """
        Initialize tree LangGraph service.
        
        Args:
            db: Database session
            user: Current authenticated user
        """
        self.db = db
        self.user = user
        self.tree_service = TreeService(db, user)
        self.llm_client = LLMClient()
    
    async def build_message_history(self, node_id: str) -> List[BaseMessage]:
        """
        Build LangChain message history from node lineage.
        Walks from root to specified node.
        
        Args:
            node_id: Node ID to build history up to
            
        Returns:
            List of LangChain messages
        """
        # Get lineage (root to node)
        lineage = await self.tree_service.get_lineage(node_id)
        
        messages: List[BaseMessage] = []
        
        # Add system message
        messages.append(SystemMessage(content=self._get_system_prompt()))
        
        # Convert nodes to messages
        for node in lineage:
            if node.user_message:
                messages.append(HumanMessage(content=node.user_message))
            
            if node.ai_message:
                messages.append(AIMessage(content=node.ai_message))
        
        logger.info(f"Built message history with {len(messages)} messages from lineage of {len(lineage)} nodes")
        return messages
    
    async def send_message_with_tree(
        self,
        chat_id: int,
        parent_node_id: str,
        user_message: str,
        regenerate: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Send a message in the tree context and stream AI response.
        
        Args:
            chat_id: Chat ID
            parent_node_id: Parent node to send from
            user_message: User's message
            regenerate: If True, creates sibling instead of child
            
        Yields:
            Stream events with node IDs and content
        """
        try:
            # Verify parent node
            parent_node = await self.tree_service.get_node(parent_node_id)
            
            # Determine actual parent for new node
            if regenerate:
                # Create sibling: use parent's parent
                actual_parent_id = parent_node.parent_id
                yield {
                    "type": "info",
                    "data": {"message": "Regenerating response as sibling node"}
                }
            else:
                # Create child: use current node as parent
                actual_parent_id = parent_node_id
            
            # Create user message node
            user_node = await self.tree_service.create_node(
                chat_id=chat_id,
                parent_id=actual_parent_id,
                user_message=user_message,
                ai_message=None
            )
            
            yield {
                "type": "user_node_created",
                "data": {
                    "node_id": user_node.id,
                    "parent_id": actual_parent_id,
                    "depth": user_node.depth
                }
            }
            
            # Build message history from lineage
            messages = await self.build_message_history(user_node.id)
            
            yield {
                "type": "lineage_built",
                "data": {
                    "message_count": len(messages),
                    "depth": user_node.depth
                }
            }
            
            # Stream AI response
            ai_response_chunks = []
            metadata_info = {
                "model": settings.LLM_MODEL,
                "tokens_used": 0,
                "tools_used": []
            }
            
            async for event in self.llm_client.stream_chat(messages, chat_id):
                # Forward stream events
                yield event
                
                # Collect response chunks
                if event.get("type") == "content":
                    ai_response_chunks.append(event.get("content", ""))
                
                # Collect metadata
                if event.get("type") == "tool_output":
                    tool_name = event.get("data", {}).get("tool_name")
                    if tool_name and tool_name not in metadata_info["tools_used"]:
                        metadata_info["tools_used"].append(tool_name)
            
            # Combine AI response
            ai_response = "".join(ai_response_chunks)
            
            # Create AI response node
            ai_metadata = NodeMetadata(
                model=metadata_info["model"],
                tokens_used=metadata_info["tokens_used"],
                tools_used=metadata_info["tools_used"]
            )
            
            ai_node = await self.tree_service.create_node(
                chat_id=chat_id,
                parent_id=user_node.id,
                user_message=None,
                ai_message=ai_response,
                metadata=ai_metadata
            )
            
            yield {
                "type": "ai_node_created",
                "data": {
                    "node_id": ai_node.id,
                    "parent_id": user_node.id,
                    "depth": ai_node.depth,
                    "branch_name": ai_node.branch_name
                }
            }
            
            # Get lineage for response
            lineage = await self.tree_service.get_lineage(ai_node.id)
            lineage_ids = [node.id for node in lineage]
            
            yield {
                "type": "complete",
                "data": {
                    "user_node_id": user_node.id,
                    "ai_node_id": ai_node.id,
                    "lineage": lineage_ids,
                    "depth": ai_node.depth
                }
            }
            
        except Exception as e:
            logger.error(f"Error in send_message_with_tree: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": {"error": str(e)}
            }
    
    async def regenerate_response(
        self,
        chat_id: int,
        node_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Regenerate AI response for a node (creates sibling).
        
        Args:
            chat_id: Chat ID
            node_id: Node ID to regenerate from
            
        Yields:
            Stream events
        """
        node = await self.tree_service.get_node(node_id)
        
        if not node.user_message:
            yield {
                "type": "error",
                "data": {"error": "Cannot regenerate: node has no user message"}
            }
            return
        
        # Use parent to create sibling
        if node.parent_id:
            async for event in self.send_message_with_tree(
                chat_id=chat_id,
                parent_node_id=node.id,
                user_message=node.user_message,
                regenerate=True
            ):
                yield event
        else:
            yield {
                "type": "error",
                "data": {"error": "Cannot regenerate root node"}
            }
    
    async def continue_from_node(
        self,
        chat_id: int,
        node_id: str,
        user_message: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Continue conversation from a specific node.
        
        Args:
            chat_id: Chat ID
            node_id: Node ID to continue from
            user_message: User's message
            
        Yields:
            Stream events
        """
        # Set as active node
        await self.tree_service.set_active_node(chat_id, node_id)
        
        # Send message from this node
        async for event in self.send_message_with_tree(
            chat_id=chat_id,
            parent_node_id=node_id,
            user_message=user_message,
            regenerate=False
        ):
            yield event
    
    async def compare_branches(
        self,
        node_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Compare multiple branches (nodes).
        
        Args:
            node_ids: List of node IDs to compare
            
        Returns:
            Comparison data
        """
        nodes = []
        lineages = []
        
        for node_id in node_ids:
            node = await self.tree_service.get_node(node_id)
            nodes.append(node)
            
            lineage = await self.tree_service.get_lineage(node_id)
            lineages.append(lineage)
        
        # Find common ancestor
        common_ancestor_id = None
        if len(lineages) >= 2:
            # Find where lineages diverge
            min_length = min(len(l) for l in lineages)
            for i in range(min_length):
                if all(lineages[j][i].id == lineages[0][i].id for j in range(len(lineages))):
                    common_ancestor_id = lineages[0][i].id
                else:
                    break
        
        return {
            "nodes": [
                {
                    "id": node.id,
                    "user_message": node.user_message,
                    "ai_message": node.ai_message,
                    "branch_name": node.branch_name,
                    "depth": node.depth,
                    "created_at": node.created_at.isoformat()
                }
                for node in nodes
            ],
            "common_ancestor_id": common_ancestor_id,
            "lineage_lengths": [len(l) for l in lineages],
            "divergence_point": common_ancestor_id
        }
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for the conversation."""
        return get_prompt("tree_system")
    
    async def get_context_for_node(self, node_id: str) -> Dict[str, Any]:
        """
        Get full context for a node (lineage + metadata).
        
        Args:
            node_id: Node ID
            
        Returns:
            Context data
        """
        node = await self.tree_service.get_node(node_id)
        lineage = await self.tree_service.get_lineage(node_id)
        messages = await self.build_message_history(node_id)
        
        return {
            "node": {
                "id": node.id,
                "depth": node.depth,
                "branch_name": node.branch_name,
                "user_message": node.user_message,
                "ai_message": node.ai_message
            },
            "lineage": [
                {
                    "id": n.id,
                    "depth": n.depth,
                    "user_message": n.user_message,
                    "ai_message": n.ai_message
                }
                for n in lineage
            ],
            "message_count": len(messages),
            "context_length": sum(len(m.content) for m in messages if hasattr(m, 'content'))
        }
