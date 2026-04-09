"""
API routes for conversation tree operations.
"""

import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.tables import User
from app.models.tree_schemas import (
    BranchCreateRequest,
    BranchCreateResponse,
    CompareNodesRequest,
    ConversationNodeResponse,
    ConversationNodeUpdate,
    ConversationTreeResponse,
    ConversationTreeStructure,
    MessageSendRequest,
    MigrateToTreeRequest,
    MigrateToTreeResponse,
    NodeChildrenResponse,
    NodeLineageResponse,
    SetActiveNodeRequest,
    TreeStatistics,
)
from app.services.tree_langgraph_service import TreeLangGraphService
from app.services.tree_service import TreeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tree", tags=["Conversation Tree"])


# ==================== Tree Management ====================


@router.post("/chats/{chat_id}/init", response_model=ConversationTreeResponse)
async def initialize_tree(
    chat_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Initialize a conversation tree for a chat.
    Creates root node and tree metadata.
    """
    tree_service = TreeService(db, current_user)
    tree = await tree_service.create_tree_for_chat(chat_id)

    return ConversationTreeResponse(
        id=tree.id,
        chat_id=tree.chat_id,
        user_id=tree.user_id,
        root_node_id=tree.root_node_id,
        active_node_id=tree.active_node_id,
        total_nodes=tree.total_nodes,
        total_branches=tree.total_branches,
        max_depth=tree.max_depth,
        created_at=tree.created_at,
        updated_at=tree.updated_at,
    )


@router.get("/chats/{chat_id}", response_model=ConversationTreeStructure)
async def get_tree_structure(
    chat_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get complete tree structure for visualization.
    Returns all nodes and adjacency list.
    """
    tree_service = TreeService(db, current_user)
    structure = await tree_service.get_tree_structure(chat_id)
    return structure


@router.get("/chats/{chat_id}/stats", response_model=TreeStatistics)
async def get_tree_statistics(
    chat_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get statistics about the conversation tree.
    """
    tree_service = TreeService(db, current_user)
    stats = await tree_service.get_tree_statistics(chat_id)
    return stats


# ==================== Node Operations ====================


@router.get("/nodes/{node_id}", response_model=ConversationNodeResponse)
async def get_node(node_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get a specific node by ID.
    """
    tree_service = TreeService(db, current_user)
    node = await tree_service.get_node(node_id)

    # Parse metadata
    metadata = None
    if node.metadata_json:
        try:
            metadata = json.loads(node.metadata_json)
        except Exception:
            pass

    return ConversationNodeResponse(
        id=node.id,
        conversation_id=node.conversation_id,
        parent_id=node.parent_id,
        depth=node.depth,
        user_message=node.user_message,
        ai_message=node.ai_message,
        metadata=metadata,
        branch_name=node.branch_name,
        is_active=node.is_active,
        user_id=node.user_id,
        checkpoint_id=node.checkpoint_id,
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


@router.patch("/nodes/{node_id}", response_model=ConversationNodeResponse)
async def update_node(
    node_id: str,
    update_data: ConversationNodeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a node's content.
    """
    tree_service = TreeService(db, current_user)

    node = await tree_service.update_node(
        node_id=node_id,
        user_message=update_data.user_message,
        ai_message=update_data.ai_message,
        metadata=update_data.metadata,
        branch_name=update_data.branch_name,
    )

    # Parse metadata
    metadata = None
    if node.metadata_json:
        try:
            metadata = json.loads(node.metadata_json)
        except Exception:
            pass

    return ConversationNodeResponse(
        id=node.id,
        conversation_id=node.conversation_id,
        parent_id=node.parent_id,
        depth=node.depth,
        user_message=node.user_message,
        ai_message=node.ai_message,
        metadata=metadata,
        branch_name=node.branch_name,
        is_active=node.is_active,
        user_id=node.user_id,
        checkpoint_id=node.checkpoint_id,
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


@router.get("/nodes/{node_id}/lineage", response_model=NodeLineageResponse)
async def get_node_lineage(
    node_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get the lineage (path from root) for a node.
    """
    tree_service = TreeService(db, current_user)
    lineage = await tree_service.get_lineage(node_id)

    lineage_responses = []
    for node in lineage:
        metadata = None
        if node.metadata_json:
            try:
                metadata = json.loads(node.metadata_json)
            except Exception:
                pass

        lineage_responses.append(
            ConversationNodeResponse(
                id=node.id,
                conversation_id=node.conversation_id,
                parent_id=node.parent_id,
                depth=node.depth,
                user_message=node.user_message,
                ai_message=node.ai_message,
                metadata=metadata,
                branch_name=node.branch_name,
                is_active=node.is_active,
                user_id=node.user_id,
                checkpoint_id=node.checkpoint_id,
                created_at=node.created_at,
                updated_at=node.updated_at,
            )
        )

    return NodeLineageResponse(node_id=node_id, lineage=lineage_responses, depth=lineage[-1].depth if lineage else 0)


@router.get("/nodes/{node_id}/children", response_model=NodeChildrenResponse)
async def get_node_children(
    node_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get all children of a node.
    """
    tree_service = TreeService(db, current_user)
    children = await tree_service.get_children(node_id)

    children_responses = []
    for node in children:
        metadata = None
        if node.metadata_json:
            try:
                metadata = json.loads(node.metadata_json)
            except Exception:
                pass

        children_responses.append(
            ConversationNodeResponse(
                id=node.id,
                conversation_id=node.conversation_id,
                parent_id=node.parent_id,
                depth=node.depth,
                user_message=node.user_message,
                ai_message=node.ai_message,
                metadata=metadata,
                branch_name=node.branch_name,
                is_active=node.is_active,
                user_id=node.user_id,
                checkpoint_id=node.checkpoint_id,
                created_at=node.created_at,
                updated_at=node.updated_at,
            )
        )

    return NodeChildrenResponse(node_id=node_id, children=children_responses, total_children=len(children))


# ==================== Branching Operations ====================


@router.post("/nodes/{node_id}/fork", response_model=BranchCreateResponse)
async def fork_node(
    node_id: str,
    request: BranchCreateRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fork a node (create a copy as a sibling).
    This allows exploring alternative responses.
    """
    tree_service = TreeService(db, current_user)

    branch_name = request.branch_name if request else None
    forked_node = await tree_service.fork_node(node_id, branch_name)

    # Parse metadata
    metadata = None
    if forked_node.metadata_json:
        try:
            metadata = json.loads(forked_node.metadata_json)
        except Exception:
            pass

    node_response = ConversationNodeResponse(
        id=forked_node.id,
        conversation_id=forked_node.conversation_id,
        parent_id=forked_node.parent_id,
        depth=forked_node.depth,
        user_message=forked_node.user_message,
        ai_message=forked_node.ai_message,
        metadata=metadata,
        branch_name=forked_node.branch_name,
        is_active=forked_node.is_active,
        user_id=forked_node.user_id,
        checkpoint_id=forked_node.checkpoint_id,
        created_at=forked_node.created_at,
        updated_at=forked_node.updated_at,
    )

    return BranchCreateResponse(
        new_node=node_response,
        branch_name=forked_node.branch_name or "Forked Branch",
        message=f"Successfully forked node {node_id}",
    )


@router.post("/chats/{chat_id}/active-node")
async def set_active_node(
    chat_id: int,
    request: SetActiveNodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Set the active node in the tree.
    This determines which branch is currently being viewed/edited.
    """
    tree_service = TreeService(db, current_user)
    tree = await tree_service.set_active_node(chat_id, request.node_id)

    return {"message": "Active node updated", "active_node_id": tree.active_node_id, "chat_id": chat_id}


# ==================== Message Operations ====================


@router.post("/chats/{chat_id}/send")
async def send_message(
    chat_id: int,
    request: MessageSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message in the tree context.
    Streams the AI response using Server-Sent Events.
    """

    async def event_generator():
        tree_service = TreeLangGraphService(db, current_user)

        try:
            async for event in tree_service.send_message_with_tree(
                chat_id=chat_id,
                parent_node_id=request.node_id,
                user_message=request.message,
                regenerate=request.regenerate,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Error in send_message stream: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/nodes/{node_id}/regenerate")
async def regenerate_response(
    node_id: str, chat_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Regenerate AI response for a node.
    Creates a sibling node with a new response.
    """

    async def event_generator():
        tree_service = TreeLangGraphService(db, current_user)

        try:
            async for event in tree_service.regenerate_response(chat_id=chat_id, node_id=node_id):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Error in regenerate stream: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/nodes/compare")
async def compare_nodes(
    request: CompareNodesRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Compare multiple nodes/branches.
    Returns comparison data including common ancestor.
    """
    tree_service = TreeLangGraphService(db, current_user)
    comparison = await tree_service.compare_branches(request.node_ids)

    return comparison


# ==================== Migration ====================


@router.delete("/chats/{chat_id}")
async def delete_tree(chat_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Delete conversation tree for a chat.
    Useful for forcing a fresh migration.
    """
    tree_service = TreeService(db, current_user)

    # Delete tree (this will cascade delete all nodes)
    from sqlalchemy import delete

    from app.models.conversation_tree import ConversationTree

    # Verify access
    await tree_service._verify_chat_access(chat_id)

    # Delete tree
    await db.execute(delete(ConversationTree).where(ConversationTree.chat_id == chat_id))
    await db.commit()

    logger.info(f"Deleted tree for chat {chat_id}")
    return {"message": "Tree deleted successfully"}


@router.post("/migrate", response_model=MigrateToTreeResponse)
async def migrate_chat_to_tree(
    request: MigrateToTreeRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Migrate existing linear chat to tree structure.
    Converts all messages to nodes in a linear tree.
    If tree already exists, deletes it first.
    """
    tree_service = TreeService(db, current_user)

    # Check if tree already exists
    from sqlalchemy import delete, select

    from app.models.conversation_tree import ConversationTree

    result = await db.execute(select(ConversationTree).where(ConversationTree.chat_id == request.chat_id))
    existing_tree = result.scalar_one_or_none()

    if existing_tree:
        logger.info(f"Deleting existing tree for chat {request.chat_id} before migration")
        await db.execute(delete(ConversationTree).where(ConversationTree.chat_id == request.chat_id))
        await db.commit()

    # Now migrate
    tree, nodes_created = await tree_service.migrate_linear_chat_to_tree(request.chat_id)

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
        updated_at=tree.updated_at,
    )

    return MigrateToTreeResponse(
        tree=tree_response,
        nodes_created=nodes_created,
        root_node_id=tree.root_node_id,
        message=f"Successfully migrated chat to tree with {nodes_created} nodes",
    )


# ==================== Context & Debug ====================


@router.get("/nodes/{node_id}/context")
async def get_node_context(
    node_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get full context for a node including lineage and message history.
    Useful for debugging and understanding the conversation state.
    """
    tree_service = TreeLangGraphService(db, current_user)
    context = await tree_service.get_context_for_node(node_id)
    return context
