"""
Provider factory for OSS-friendly runtime configuration.
"""
from __future__ import annotations

from typing import Any, Dict, List

from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import settings


def _openai_api_key() -> str:
    # Local OpenAI-compatible servers often accept any non-empty key.
    return settings.OPENAI_API_KEY or "local-dev-key"


def create_chat_model(temperature: float = 0.2):
    """Create the configured chat model."""
    if settings.MODEL_PROVIDER == "google":
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=temperature,
        )

    if settings.MODEL_PROVIDER == "groq":
        return ChatGroq(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            api_key=settings.GROQ_API_KEY,
            temperature=temperature,
        )

    if settings.MODEL_PROVIDER == "openai_compatible":
        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=_openai_api_key(),
            base_url=settings.OPENAI_API_BASE_URL,
            temperature=temperature,
        )

    raise ValueError(f"Unsupported MODEL_PROVIDER: {settings.MODEL_PROVIDER}")


def create_embedding_model():
    """Create the configured embedding model."""
    if settings.EMBEDDING_PROVIDER == "google":
        return GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=settings.GOOGLE_API_KEY,
        )

    if settings.EMBEDDING_PROVIDER == "openai_compatible":
        return OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            api_key=_openai_api_key(),
            base_url=settings.OPENAI_API_BASE_URL,
        )

    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {settings.EMBEDDING_PROVIDER}")


def create_tavily_search_tool() -> TavilySearchResults | None:
    if not settings.TAVILY_API_KEY:
        return None
    return TavilySearchResults(max_results=5)


def create_duckduckgo_search_tool() -> DuckDuckGoSearchResults:
    return DuckDuckGoSearchResults(
        name="duckduckgo_search",
        num_results=5,
        output_format="list",
    )


def get_search_tools() -> List[Any]:
    """Return the configured web-search tools."""
    if settings.SEARCH_PROVIDER == "tavily":
        tavily_tool = create_tavily_search_tool()
        return [tavily_tool] if tavily_tool else [create_duckduckgo_search_tool()]

    if settings.SEARCH_PROVIDER == "duckduckgo":
        return [create_duckduckgo_search_tool()]

    if settings.SEARCH_PROVIDER == "both":
        tools: List[Any] = [create_duckduckgo_search_tool()]
        tavily_tool = create_tavily_search_tool()
        if tavily_tool is not None:
            tools.insert(0, tavily_tool)
        return tools

    raise ValueError(f"Unsupported SEARCH_PROVIDER: {settings.SEARCH_PROVIDER}")


async def run_configured_search(query: str) -> List[Dict[str, Any]]:
    """Run a search query and normalize the results."""
    tool = get_search_tools()[0]
    raw = await tool.ainvoke({"query": query})

    if isinstance(raw, list):
        normalized: List[Dict[str, Any]] = []
        for item in raw:
            if isinstance(item, dict):
                normalized.append(
                    {
                        "title": item.get("title") or item.get("snippet") or query,
                        "url": item.get("url") or item.get("link") or "",
                        "content": item.get("content") or item.get("snippet") or str(item),
                    }
                )
            else:
                normalized.append({"title": query, "url": "", "content": str(item)})
        return normalized

    if isinstance(raw, str):
        return [{"title": query, "url": "", "content": raw}]

    return [{"title": query, "url": "", "content": str(raw)}]
