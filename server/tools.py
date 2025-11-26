# tools.py
from dotenv import load_dotenv
load_dotenv()

from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.tools import DuckDuckGoSearchRun
import requests
from app.prompts.prompt_library import get_prompt

# -----------------
# Tavily Search Tool
# -----------------
tavily_tool = TavilySearchResults(max_results=4)

# -----------------
# DuckDuckGo Search Tool
# -----------------
duck_tool = DuckDuckGoSearchRun(region="us-en")

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
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey=C9PE94QUEW9VWGFM"
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

# -----------------
# Export Tools
# -----------------
tools = [tavily_tool, duck_tool, calculator, get_stock_price, search_documents]
