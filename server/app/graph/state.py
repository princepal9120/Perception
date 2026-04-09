"""LangGraph state definitions."""

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    runtime_provider_config: dict | None
