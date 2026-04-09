"""
Deep Research API Routes.
Provides SSE streaming endpoint for deep research mode.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.deep_research_graph import DeepResearchGraph
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.runtime_provider_config import (
    RuntimeProviderConfig,
    get_runtime_provider_config,
    runtime_provider_config_context,
)
from app.models.tables import User
from app.services.provider_factory import create_chat_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/deep-research", tags=["Deep Research"])


# ============================================
# Request/Response Models
# ============================================


class DeepResearchRequest(BaseModel):
    """Request model for deep research."""

    topic: str = Field(..., min_length=3, max_length=500, description="Research topic")
    depth: int = Field(default=3, ge=1, le=5, description="Research depth level (1-5)")
    iterations: int = Field(default=3, ge=1, le=10, description="Number of iterations (1-10)")


# ============================================
# SSE Streaming Endpoint
# ============================================


@router.post("/stream")
async def stream_deep_research(
    request: DeepResearchRequest,
    current_user: User = Depends(get_current_user),
    runtime_provider_config: RuntimeProviderConfig | None = Depends(get_runtime_provider_config),
):
    """
    Stream deep research results via SSE.

    This endpoint performs iterative research and streams:
    1. Iteration updates as research progresses
    2. Final structured JSON report when complete

    Args:
        request: Research parameters (topic, depth, iterations)
        current_user: Authenticated user

    Returns:
        StreamingResponse with SSE events
    """
    logger.info(
        f"Deep research started by user {current_user.id}: "
        f"topic='{request.topic}', depth={request.depth}, iterations={request.iterations}"
    )

    async def generate_research_stream():
        """Generate SSE stream for research progress."""
        try:
            with runtime_provider_config_context(runtime_provider_config):
                # Initialize research graph
                llm = create_chat_model(temperature=0.3)
                research_graph = DeepResearchGraph(
                    llm=llm,
                    runtime_provider_config=runtime_provider_config,
                )

                # Send start event
                yield f'data: {json.dumps({"type": "start", "message": "Deep research initiated"})}\n\n'

                # Initialize state
                initial_state = {
                    "topic": request.topic,
                    "depth": request.depth,
                    "iterations": request.iterations,
                    "current_iteration": 0,
                    "all_verified_claims": [],
                    "research_log": [],
                    "current_documents": "",
                    "current_queries": [],
                    "final_report": None,
                    "iteration_updates": [],
                }

                # Stream graph execution
                iteration_count = 0
                async for event in research_graph.graph.astream(initial_state):
                    # Check if we have iteration updates
                    for _, node_state in event.items():
                        if isinstance(node_state, dict):
                            # Send iteration updates
                            iteration_updates = node_state.get("iteration_updates", [])

                            # Only send new updates
                            for update in iteration_updates[iteration_count:]:
                                yield f"data: {json.dumps(update)}\n\n"
                                iteration_count += 1
                                await asyncio.sleep(0.1)  # Small delay for client processing

                            # Check if final report is ready
                            if node_state.get("final_report"):
                                final_report = node_state["final_report"]

                                # Send final report
                                final_event = {"type": "final", "report": final_report}
                                yield f"data: {json.dumps(final_event)}\n\n"

            # Send completion event
            yield f'data: {json.dumps({"type": "complete", "message": "Research complete"})}\n\n'

            logger.info(f"✅ Deep research completed for user {current_user.id}")

        except Exception as e:
            logger.error(f"❌ Deep research failed: {e}", exc_info=True)
            error_event = {"type": "error", "message": f"Research failed: {str(e)}"}
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        generate_research_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering for nginx
        },
    )


# ============================================
# Health Check Endpoint
# ============================================


@router.get("/health")
async def deep_research_health():
    """
    Health check for deep research service.

    Returns:
        Service status
    """
    try:
        return {
            "status": "healthy",
            "service": "deep_research",
            "model_provider": settings.MODEL_PROVIDER,
            "search_provider": settings.SEARCH_PROVIDER,
            "llm_model": settings.OPENAI_MODEL
            if settings.MODEL_PROVIDER == "openai_compatible"
            else settings.MODEL_PROVIDER,
            "features": {"streaming": True, "max_depth": 5, "max_iterations": 10},
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


# ============================================
# Info Endpoint
# ============================================


@router.get("/info")
async def deep_research_info():
    """
    Get information about deep research capabilities.

    Returns:
        Service information and usage guide
    """
    return {
        "service": "Deep Research Mode",
        "description": "Iterative research agent with RAG-powered retrieval and claim verification",
        "parameters": {
            "topic": {
                "type": "string",
                "description": "Research topic or question",
                "min_length": 3,
                "max_length": 500,
            },
            "depth": {
                "type": "integer",
                "description": "Research depth level",
                "min": 1,
                "max": 5,
                "levels": {
                    1: "Basic overview",
                    2: "Intermediate analysis",
                    3: "Advanced research",
                    4: "Expert-level investigation",
                    5: "Research-grade deep dive",
                },
            },
            "iterations": {"type": "integer", "description": "Number of research iterations", "min": 1, "max": 10},
        },
        "output_format": {
            "executive_summary": "High-level overview",
            "background": "Context and foundational information",
            "key_findings": "List of key discoveries",
            "technical_details": "In-depth technical analysis",
            "opportunities_risks": "Identified opportunities and risks",
            "applications": "Practical applications",
            "references": "Source citations",
            "research_log": "Iteration-by-iteration research log",
        },
        "streaming": {
            "type": "SSE (Server-Sent Events)",
            "events": [
                {"type": "start", "description": "Research initiated"},
                {"type": "iteration", "description": "Iteration progress update"},
                {"type": "final", "description": "Final research report"},
                {"type": "complete", "description": "Research completed"},
                {"type": "error", "description": "Error occurred"},
            ],
        },
    }
