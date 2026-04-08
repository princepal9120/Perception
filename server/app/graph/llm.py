"""LLM initialization for the graph."""
from app.services.provider_factory import create_chat_model


def create_llm():
    """Create the primary LLM instance."""
    return create_chat_model()


# Module-level LLM instance
llm = create_llm()
