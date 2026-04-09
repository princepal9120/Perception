"""Request-scoped runtime provider configuration for OSS local settings UI."""

from __future__ import annotations

import base64
import json
from contextlib import contextmanager
from contextvars import ContextVar, Token
from typing import Literal

from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, ValidationError, field_validator


class RuntimeProviderConfig(BaseModel):
    """Optional request-scoped provider overrides supplied by the frontend."""

    model_config = ConfigDict(extra="forbid")

    model_provider: Literal["openai_compatible", "groq", "google"] | None = None
    embedding_provider: Literal["openai_compatible", "google"] | None = None
    search_provider: Literal["duckduckgo", "tavily", "both"] | None = None

    model_name: str | None = None
    embedding_model_name: str | None = None

    api_key: str | None = None
    base_url: str | None = None
    tavily_api_key: str | None = None

    @field_validator(
        "model_name",
        "embedding_model_name",
        "api_key",
        "base_url",
        "tavily_api_key",
        mode="before",
    )
    @classmethod
    def normalize_blank_strings(cls, value: str | None):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


_runtime_provider_config: ContextVar[RuntimeProviderConfig | None] = ContextVar(
    "runtime_provider_config",
    default=None,
)


def get_active_runtime_provider_config() -> RuntimeProviderConfig | None:
    return _runtime_provider_config.get()


def get_current_runtime_provider_config() -> RuntimeProviderConfig | None:
    """Backward-compatible alias for call sites."""
    return get_active_runtime_provider_config()


@contextmanager
def runtime_provider_config_context(config: RuntimeProviderConfig | None):
    token: Token = _runtime_provider_config.set(config)
    try:
        yield
    finally:
        _runtime_provider_config.reset(token)


async def get_runtime_provider_config(
    x_perception_runtime_config: str | None = Header(default=None, alias="X-Perception-Runtime-Config"),
) -> RuntimeProviderConfig | None:
    """Decode optional runtime config header from the frontend."""
    if not x_perception_runtime_config:
        return None

    try:
        padded = x_perception_runtime_config + "=" * (-len(x_perception_runtime_config) % 4)
        decoded = base64.urlsafe_b64decode(padded).decode("utf-8")
        payload = json.loads(decoded)
        if not isinstance(payload, dict):
            raise ValueError("Runtime config payload must be an object")
        return RuntimeProviderConfig.model_validate(payload)
    except (ValueError, json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid runtime provider config: {exc}",
        ) from exc
