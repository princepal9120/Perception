"""LLM initialization for the graph."""
from langchain_google_genai import ChatGoogleGenerativeAI


def create_llm():
    """Create the primary LLM instance."""
    return ChatGoogleGenerativeAI(model="gemini-2.0-flash")


# Module-level LLM instance
llm = create_llm()
