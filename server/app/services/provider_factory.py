"""
Provider factory for OSS-friendly runtime configuration.
"""
from __future__ import annotations

import warnings
from typing import Any, Dict, List

from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import settings
from app.core.runtime_provider_config import (
    RuntimeProviderConfig,
    get_current_runtime_provider_config,
)


DEFAULT_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
DEFAULT_GOOGLE_MODEL = "gemini-2.0-flash"
DEFAULT_GOOGLE_EMBEDDING_MODEL = "models/text-embedding-004"


def _runtime_value(name: str, runtime_config: RuntimeProviderConfig | None = None) -> str | None:
    active_runtime_config = runtime_config or get_current_runtime_provider_config()
    return getattr(active_runtime_config, name, None) if active_runtime_config else None


def _effective_model_provider(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("model_provider", runtime_config) or settings.MODEL_PROVIDER


def _effective_search_provider(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("search_provider", runtime_config) or settings.SEARCH_PROVIDER


def _effective_embedding_provider(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("embedding_provider", runtime_config) or settings.EMBEDDING_PROVIDER


def _effective_model_name(runtime_config: RuntimeProviderConfig | None = None) -> str:
    runtime_model_name = _runtime_value("model_name", runtime_config)
    provider = _effective_model_provider(runtime_config)
    if runtime_model_name:
        return runtime_model_name
    if provider == "google":
        return DEFAULT_GOOGLE_MODEL
    if provider == "groq":
        return DEFAULT_GROQ_MODEL
    return settings.OPENAI_MODEL


def _effective_embedding_model_name(runtime_config: RuntimeProviderConfig | None = None) -> str:
    runtime_embedding_model_name = _runtime_value("embedding_model_name", runtime_config)
    provider = _effective_embedding_provider(runtime_config)
    if runtime_embedding_model_name:
        return runtime_embedding_model_name
    if provider == "google":
        return DEFAULT_GOOGLE_EMBEDDING_MODEL
    return settings.OPENAI_EMBEDDING_MODEL


def _effective_google_api_key(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("api_key", runtime_config) or settings.GOOGLE_API_KEY


def _effective_groq_api_key(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("api_key", runtime_config) or settings.GROQ_API_KEY


def _effective_openai_base_url(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("base_url", runtime_config) or settings.OPENAI_API_BASE_URL


def _effective_tavily_api_key(runtime_config: RuntimeProviderConfig | None = None) -> str:
    return _runtime_value("tavily_api_key", runtime_config) or settings.TAVILY_API_KEY


def _openai_api_key(runtime_config: RuntimeProviderConfig | None = None) -> str:
    # Local OpenAI-compatible servers often accept any non-empty key.
    return _runtime_value("api_key", runtime_config) or settings.OPENAI_API_KEY or "local-dev-key"


def create_chat_model(
    temperature: float = 0.2,
    runtime_config: RuntimeProviderConfig | None = None,
):
    """Create the configured chat model."""
    provider = _effective_model_provider(runtime_config)

    if provider == "google":
        return ChatGoogleGenerativeAI(
            model=_effective_model_name(runtime_config),
            google_api_key=_effective_google_api_key(runtime_config),
            temperature=temperature,
        )

    if provider == "groq":
        return ChatGroq(
            model=_effective_model_name(runtime_config),
            api_key=_effective_groq_api_key(runtime_config),
            temperature=temperature,
        )

    if provider == "openai_compatible":
        return ChatOpenAI(
            model=_effective_model_name(runtime_config),
            api_key=_openai_api_key(runtime_config),
            base_url=_effective_openai_base_url(runtime_config),
            temperature=temperature,
        )

    raise ValueError(f"Unsupported MODEL_PROVIDER: {provider}")


def create_embedding_model(runtime_config: RuntimeProviderConfig | None = None):
    """Create the configured embedding model."""
    provider = _effective_embedding_provider(runtime_config)

    if provider == "google":
        return GoogleGenerativeAIEmbeddings(
            model=_effective_embedding_model_name(runtime_config),
            google_api_key=_effective_google_api_key(runtime_config),
        )

    if provider == "openai_compatible":
        return OpenAIEmbeddings(
            model=_effective_embedding_model_name(runtime_config),
            api_key=_openai_api_key(runtime_config),
            base_url=_effective_openai_base_url(runtime_config),
        )

    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider}")


def create_tavily_search_tool(
    runtime_config: RuntimeProviderConfig | None = None,
) -> TavilySearchResults | None:
    if not _effective_tavily_api_key(runtime_config):
        return None
    return TavilySearchResults(max_results=5)


def create_duckduckgo_search_tool() -> DuckDuckGoSearchResults:
    return DuckDuckGoSearchResults(
        name="duckduckgo_search",
        num_results=5,
        output_format="list",
    )


def get_search_tools(runtime_config: RuntimeProviderConfig | None = None) -> List[Any]:
    """Return the configured web-search tools."""
    search_provider = _effective_search_provider(runtime_config)

    if search_provider == "tavily":
        tavily_tool = create_tavily_search_tool(runtime_config)
        return [tavily_tool] if tavily_tool else [create_duckduckgo_search_tool()]

    if search_provider == "duckduckgo":
        return [create_duckduckgo_search_tool()]

    if search_provider == "both":
        tools: List[Any] = [create_duckduckgo_search_tool()]
        tavily_tool = create_tavily_search_tool(runtime_config)
        if tavily_tool is not None:
            tools.insert(0, tavily_tool)
        return tools

    raise ValueError(f"Unsupported SEARCH_PROVIDER: {search_provider}")


async def run_configured_search(
    query: str,
    runtime_config: RuntimeProviderConfig | None = None,
) -> List[Dict[str, Any]]:
    """Run a search query and normalize the results."""
    tool = get_search_tools(runtime_config)[0]
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message=r"This package .*ddgs.*",
            category=RuntimeWarning,
        )
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
