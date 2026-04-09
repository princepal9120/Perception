# tools.py
import logging

from dotenv import load_dotenv

load_dotenv()

from langchain_core.tools import tool

logger = logging.getLogger(__name__)
import requests

from app.core.runtime_provider_config import RuntimeProviderConfig
from app.prompts.prompt_library import get_prompt
from app.services.provider_factory import create_duckduckgo_search_tool, create_tavily_search_tool, get_search_tools

# -----------------
# Lazy Tool Initialization (for Docker compatibility)
# -----------------
_tavily_tool = None
_duck_tool = None


def get_tavily_tool():
    """Get Tavily tool with lazy initialization."""
    global _tavily_tool
    if _tavily_tool is None:
        _tavily_tool = create_tavily_search_tool()
    return _tavily_tool


def get_duck_tool():
    """Get DuckDuckGo tool with lazy initialization."""
    global _duck_tool
    if _duck_tool is None:
        _duck_tool = create_duckduckgo_search_tool()
    return _duck_tool


# For backward compatibility - these will be None until first use
tavily_tool = None
duck_tool = None

tavily_tool = get_tavily_tool()
duck_tool = get_duck_tool()


# -----------------
# Calculator Tool
# -----------------
@tool
def calculator(first_num: float, second_num: float, operation: str) -> dict:
    """
    Perform a basic arithmetic operation on two numbers.
    Supported operations: add, sub, mul, div
    """
    try:
        if operation == "add":
            result = first_num + second_num
        elif operation == "sub":
            result = first_num - second_num
        elif operation == "mul":
            result = first_num * second_num
        elif operation == "div":
            if second_num == 0:
                return {"error": "Division by zero is not allowed"}
            result = first_num / second_num
        else:
            return {"error": f"Unsupported operation '{operation}'"}
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}


# -----------------
# Stock API Tool
# -----------------
@tool
def get_stock_price(symbol: str) -> dict:
    """
    Fetch latest stock price for a given symbol (e.g. 'AAPL', 'TSLA')
    using Alpha Vantage API.
    """
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}"
    r = requests.get(url)
    return r.json()


# -----------------
# Document Search Tool
# -----------------
# Get the detailed description from the prompt library
SEARCH_DOCUMENTS_DESCRIPTION = get_prompt("search_documents_tool")


@tool
def search_documents(query: str) -> dict:
    """
    Search and retrieve information from uploaded documents (PDFs, DOCX, TXT, MD) in the current chat session.

    Use this tool when the user asks about uploaded files or when system instructions indicate documents are available.
    This tool searches through document embeddings to find relevant content and returns formatted results with sources.
    """
    # This is a placeholder. The actual execution happens in the tool_node in main.py
    # where we have access to the chat_id/session_id.
    return {"status": "searching"}


# Override the tool's description with our detailed one from the prompt library
search_documents.description = SEARCH_DOCUMENTS_DESCRIPTION


def get_native_tools(runtime_config: RuntimeProviderConfig | None = None):
    """Build the current native tool list, including request-scoped search tools."""
    configured_search_tools = get_search_tools(runtime_config)
    base_tools = [*configured_search_tools, calculator, get_stock_price, search_documents]
    return [t for t in base_tools if t is not None]


# Backward-compatible snapshot for older imports.
tools = get_native_tools()
