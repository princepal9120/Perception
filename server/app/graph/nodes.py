"""LangGraph node functions for chat processing."""

import logging

from app.core.runtime_provider_config import RuntimeProviderConfig
from app.graph.llm import create_llm
from app.graph.state import ChatState
from app.prompts.prompt_library import get_prompt
from app.services.ingestion_service import ChatIngestor
from app.services.mcp_client_manager import mcp_manager
from langchain_core.messages import SystemMessage, ToolMessage
from langgraph.graph import END

from utils.tools import get_native_tools

logger = logging.getLogger(__name__)

# System prompt loaded once at module level
SYSTEM_PROMPT = get_prompt("perception_system")


def _runtime_provider_config_from_state(state: ChatState) -> RuntimeProviderConfig | None:
    runtime_provider_config = state.get("runtime_provider_config")
    if runtime_provider_config is None:
        return None
    if isinstance(runtime_provider_config, RuntimeProviderConfig):
        return runtime_provider_config
    if isinstance(runtime_provider_config, dict):
        return RuntimeProviderConfig.model_validate(runtime_provider_config)
    return None


async def get_all_tools(runtime_provider_config: RuntimeProviderConfig | None = None):
    """Combine native tools and MCP tools."""
    native_tools = get_native_tools(runtime_provider_config)
    mcp_tools = await mcp_manager.get_langchain_tools()
    return native_tools + mcp_tools


async def chat_node(state: ChatState, config):
    """Process a chat message through the LLM with tools."""
    messages = state["messages"]
    runtime_provider_config = _runtime_provider_config_from_state(state)

    # Add system message if not present
    has_system = any(isinstance(msg, SystemMessage) for msg in messages)
    if not has_system:
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    # Get all available tools (Native + MCP)
    all_tools = await get_all_tools(runtime_provider_config)

    # Bind tools dynamically per request to ensure latest MCP tools
    llm_with_dynamic_tools = create_llm(runtime_provider_config).bind_tools(all_tools)

    result = await llm_with_dynamic_tools.ainvoke(messages)
    return {"messages": [result]}


async def tools_router(state: ChatState):
    """Route to tool_node if the last message has tool calls, otherwise end."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tool_node"
    return END


async def tool_node(state: ChatState, config):
    """Execute tool calls from the last AI message."""
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []

    # Get chat_id from config
    chat_id = config.get("configurable", {}).get("chat_id")
    runtime_provider_config = _runtime_provider_config_from_state(state)

    # Get all tools to find the matching one
    all_tools = await get_all_tools(runtime_provider_config)
    tool_map = {t.name: t for t in all_tools}

    for call in tool_calls:
        tool_name = call["name"]
        tool_args = call["args"]
        tool_id = call["id"]

        logger.info(f"Executing tool: {tool_name}")

        try:
            if tool_name in tool_map:
                if tool_name == "search_documents":
                    logger.info(f"Executing search_documents tool. Chat ID: {chat_id}")
                    if not chat_id:
                        result = {"error": "Chat context required for document search"}
                    else:
                        try:
                            session_id = f"chat_{chat_id}"
                            ingestor = ChatIngestor(session_id=session_id, use_session_dirs=True)
                            retriever = ingestor.built_retriver([])
                            query = tool_args.get("query", "")
                            docs = await retriever.ainvoke(query)
                            results = [
                                {
                                    "content": d.page_content,
                                    "source": d.metadata.get("source"),
                                    "page": d.metadata.get("page"),
                                }
                                for d in docs
                            ]
                            result = {"results": results}
                        except Exception as e:
                            result = {"error": f"Search failed: {str(e)}"}
                else:
                    # Standard execution for all other tools (Native & MCP)
                    result = await tool_map[tool_name].ainvoke(tool_args)

                tool_messages.append(ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name))
            else:
                logger.warning(f"Unknown tool: {tool_name}")
                tool_messages.append(
                    ToolMessage(
                        content=f"Error: Tool {tool_name} not found",
                        tool_call_id=tool_id,
                        name=tool_name,
                    )
                )
        except Exception as e:
            logger.error(f"Tool execution failed: {e}")
            tool_messages.append(
                ToolMessage(
                    content=f"Error executing {tool_name}: {str(e)}",
                    tool_call_id=tool_id,
                    name=tool_name,
                )
            )

    return {"messages": tool_messages}
