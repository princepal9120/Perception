"""LLM initialization for the graph."""

from app.core.runtime_provider_config import RuntimeProviderConfig
from app.services.provider_factory import create_chat_model


def create_llm(runtime_config: RuntimeProviderConfig | None = None):
    """Create the primary LLM instance."""
    return create_chat_model(runtime_config=runtime_config)
