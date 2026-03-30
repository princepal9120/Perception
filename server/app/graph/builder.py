"""LangGraph graph builder and compilation."""
import logging
from langgraph.graph import StateGraph, END
from app.graph.state import ChatState
from app.graph.nodes import chat_node, tools_router, tool_node

logger = logging.getLogger(__name__)


def build_graph() -> StateGraph:
    """Build the LangGraph state graph (uncompiled)."""
    graph_builder = StateGraph(ChatState)
    graph_builder.add_node("chat_node", chat_node)
    graph_builder.add_node("tool_node", tool_node)
    graph_builder.set_entry_point("chat_node")
    graph_builder.add_conditional_edges("chat_node", tools_router)
    graph_builder.add_edge("tool_node", "chat_node")
    return graph_builder
