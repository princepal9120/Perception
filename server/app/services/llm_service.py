from typing import Any

from app.services.llm_client import LLMClient


class ServiceFactory:
    """Factory for creating and managing industry-specific services."""

    def get_available_industries(self) -> list[str]:
        """Get list of available industries."""
        return ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Education", "Legal", "Real Estate"]


class LLMService(LLMClient):
    """
    Enhanced LLM Service that extends LLMClient with industry-grade features.
    """

    def __init__(self, graph, config: dict[str, Any]):
        """
        Initialize LLM Service.

        Args:
            graph: Compiled LangGraph StateGraph
            config: Service configuration
        """
        super().__init__(graph)
        self.config = config
        self.service_factory = ServiceFactory()

    async def get_service_health(self) -> dict[str, Any]:
        """
        Get detailed health status of the LLM service.
        """
        return {
            "status": "healthy" if self.graph else "degraded",
            "llm_connected": True,  # Assuming connected if initialized
            "graph_initialized": self.graph is not None,
            "mode": "debug" if self.config.get("debug") else "production",
        }

    def get_service_info(self) -> dict[str, Any]:
        """
        Get service information.
        """
        return {
            "service": "LLMService",
            "version": "1.0.0",
            "capabilities": ["chat", "tools", "streaming", "industry-templates"],
            "config": {k: v for k, v in self.config.items() if "key" not in k.lower() and "secret" not in k.lower()},
        }
