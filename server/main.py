# main.py
"""
FastAPI application with integrated authentication and chat functionality.
Combines JWT-based authentication with LangGraph chat capabilities.
"""

from typing import TypedDict, Annotated, Optional
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from uuid import uuid4
import json
import os
import logging
from contextlib import asynccontextmanager

# LangGraph / LangChain
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage, BaseMessage
from langchain_groq import ChatGroq

# Import tools from tools.py
from tools import tools, tavily_tool, duck_tool, calculator, get_stock_price

# Authentication imports
from app.routers.auth import router as auth_router
from app.db.session import create_tables, check_database_connection, close_database_connection
from app.utils.session_manager import session_manager
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

# -------------------
# 1. State
# -------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# -------------------
# 2. LLM
# -------------------
llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")
llm_with_tools = llm.bind_tools(tools)

# -------------------
# 3. PostgreSQL Connection and Checkpointer (MOVED UP)
# -------------------
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Using DATABASE_URL: {DATABASE_URL}")

# We'll initialize the saver in the lifespan function
saver = None

# -------------------
# 4. Nodes
# -------------------
async def chat_node(state: ChatState):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [result]}

async def tools_router(state: ChatState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tool_node"
    return END

async def tool_node(state: ChatState):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []
    for call in tool_calls:
        tool_name = call["name"]
        tool_args = call["args"]
        tool_id = call["id"]

        # Use the correct tool
        if tool_name == "tavily_search_results_json":
            result = await tavily_tool.ainvoke(tool_args)
        elif tool_name == "DuckDuckGoSearchRun":
            result = await duck_tool.ainvoke(tool_args)
        elif tool_name == "calculator":
            result = calculator.invoke(tool_args)
        elif tool_name == "get_stock_price":
            result = get_stock_price.invoke(tool_args)
        else:
            result = {"error": f"Unknown tool {tool_name}"}

        tool_messages.append(
            ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
        )

    return {"messages": tool_messages}

# -------------------
# 5. Graph (MOVED AFTER SAVER DEFINITION)
# -------------------
# We'll compile the graph in the lifespan function after saver is initialized
graph_builder = StateGraph(ChatState)
graph_builder.add_node("chat_node", chat_node)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("chat_node")
graph_builder.add_conditional_edges("chat_node", tools_router)
graph_builder.add_edge("tool_node", "chat_node")

# Graph will be compiled in lifespan
graph = None

# -------------------
# 6. Lifespan Context Manager
# -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global saver, graph
    # --- Startup logic ---
    logger.info("🚀 Starting Perception API with Authentication")
    
    try:
        # Check database connection
        logger.info("🔄 Checking database connection...")
        db_connected = await check_database_connection()
        if not db_connected:
            logger.error("❌ Database connection failed")
            raise Exception("Database connection failed")
        
        # Create database tables for authentication
        logger.info("🔄 Creating authentication tables...")
        await create_tables()
        logger.info("✅ Authentication tables created successfully")
        
        # Start session manager cleanup task
        logger.info("🔄 Starting session manager...")
        await session_manager.start_cleanup_task()
        logger.info("✅ Session manager started")
        
        # Initialize PostgresSaver with context manager for chat
        logger.info("🔄 Connecting to PostgreSQL for chat functionality...")
        async with PostgresSaver.from_conn_string(DATABASE_URL) as postgres_saver:
            await postgres_saver.setup()
            saver = postgres_saver
            logger.info("✅ Chat PostgreSQL tables set up successfully")
            
            # Compile graph with the initialized saver
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("✅ Graph compiled with PostgreSQL checkpointer")
            
            logger.info("🎉 Application startup completed successfully")
            yield
            
    except Exception as e:
        logger.error(f"❌ Failed to setup PostgreSQL: {e}")
        logger.warning("⚠️  Using in-memory checkpointer as fallback")
        # Fallback to in-memory checkpointer
        try:
            from langgraph.checkpoint.memory import MemorySaver
            saver = MemorySaver()
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("✅ Graph compiled with in-memory checkpointer")
            
            # Still start session manager even with fallback
            await session_manager.start_cleanup_task()
            logger.info("✅ Session manager started with fallback")
            
            yield
        except Exception as fallback_error:
            logger.error(f"❌ Fallback initialization failed: {fallback_error}")
            raise
    finally:
        # --- Shutdown logic ---
        logger.info("🔄 Shutting down application...")
        
        try:
            # Stop session manager
            await session_manager.stop_cleanup_task()
            logger.info("✅ Session manager stopped")
            
            # Close database connections
            await close_database_connection()
            logger.info("✅ Database connections closed")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")
        
        logger.info("👋 Application shutdown completed")

# -------------------
# 7. FastAPI App Configuration
# -------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI application with JWT authentication and LangGraph chat capabilities",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add Session Middleware for session management
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=3600,  # 1 hour session timeout
    same_site="lax",
    https_only=False  # Set to True in production with HTTPS
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router, prefix="/api/v1")

# Add root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Perception API with Authentication",
        "version": settings.APP_VERSION,
        "docs_url": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "auth_endpoints": {
            "signup": "/api/v1/auth/signup",
            "login": "/api/v1/auth/login",
            "logout": "/api/v1/auth/logout",
            "profile": "/api/v1/auth/profile"
        }
    }

# REMOVED: Duplicate startup event handler (already handled by lifespan)

def serialise_ai_message_chunk(chunk):
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    return str(chunk)

async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    is_new = checkpoint_id is None
    if is_new:
        new_checkpoint_id = str(uuid4())
        config = {"configurable": {"thread_id": new_checkpoint_id}}
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]}, version="v2", config=config
        )
        yield f'data: {{"type":"checkpoint","checkpoint_id":"{new_checkpoint_id}"}}\n\n'
    else:
        config = {"configurable": {"thread_id": checkpoint_id}}
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]}, version="v2", config=config
        )

    async for event in events:
        etype = event["event"]

        if etype == "on_chat_model_stream":
            chunk = serialise_ai_message_chunk(event["data"]["chunk"])
            safe = chunk.replace("'", "\\'").replace("\n", "\\n")
            yield f'data: {{"type":"content","content":"{safe}"}}\n\n'

        elif etype == "on_tool_end":
            tool_output = event["data"]["output"]
            yield f'data: {{"type":"tool_output","output":{json.dumps(tool_output)}}}\n\n'

    yield f'data: {{"type":"end"}}\n\n'

@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/chat_history/{checkpoint_id}")
async def chat_history(checkpoint_id: str): 
    if saver is None:
        return {"error": "Saver not initialized"}

    state = await saver.load_state("ChatState", checkpoint_id)
    if state is None:
        return {"error": "No chat history found for this checkpoint_id"}

    messages = state.get("messages", [])
    serializable_messages = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            serializable_messages.append({"type": "human", "content": msg.content})
        elif isinstance(msg, AIMessageChunk):
            serializable_messages.append({"type": "ai", "content": msg.content})
        elif isinstance(msg, ToolMessage):
            serializable_messages.append({"type": "tool", "content": msg.content, "tool_name": msg.name})
        else:
            serializable_messages.append({"type": "unknown", "content": str(msg)})

    return {"messages": serializable_messages}




@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id),
        media_type="text/event-stream"
    )

# REMOVED: Duplicate shutdown event handler (already handled by lifespan)

if __name__ == "__main__":
    print("Application started with Neon PostgreSQL backend")