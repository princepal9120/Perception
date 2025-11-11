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

# Authentication and route imports
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router, set_llm_client
from app.db.session import create_tables, check_database_connection, close_database_connection
from app.core.config import settings
from app.services.redis_utils import redis_client
from app.services.llm_client import LLMClient

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
            tool_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
            )
        elif tool_name == "DuckDuckGoSearchRun":
            result = await duck_tool.ainvoke(tool_args)
            tool_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
            )
        elif tool_name == "calculator":
            result = calculator.invoke(tool_args)
            tool_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
            )
        elif tool_name == "get_stock_price":
            result = get_stock_price.invoke(tool_args)
            tool_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
            )
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
        
        # Create database tables
        logger.info("🔄 Creating database tables...")
        await create_tables()
        logger.info("✅ Database tables created successfully")
        
        # Connect to Redis
        logger.info("🔄 Connecting to Redis...")
        await redis_client.connect()
        if redis_client.connected:
            logger.info("✅ Redis connected successfully")
        else:
            logger.warning("⚠️  Running without Redis cache")
        
        # Initialize PostgresSaver with context manager for chat
        logger.info("🔄 Connecting to PostgreSQL for LangGraph checkpointing...")
        async with PostgresSaver.from_conn_string(DATABASE_URL) as postgres_saver:
            await postgres_saver.setup()
            saver = postgres_saver
            logger.info("✅ LangGraph checkpoint tables set up successfully")
            
            # Compile graph with the initialized saver
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("✅ Graph compiled with PostgreSQL checkpointer")
            
            # Initialize LLM client and set it for chat routes
            llm_client = LLMClient(graph)
            set_llm_client(llm_client)
            logger.info("✅ LLM client initialized")
            
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
            
            # Initialize LLM client and set it for chat routes
            llm_client = LLMClient(graph)
            set_llm_client(llm_client)
            logger.info("✅ LLM client initialized with fallback")
            
            yield
        except Exception as fallback_error:
            logger.error(f"❌ Fallback initialization failed: {fallback_error}")
            raise
    finally:
        # --- Shutdown logic ---
        logger.info("🔄 Shutting down application...")
        
        try:
            # Disconnect Redis
            await redis_client.disconnect()
            logger.info("✅ Redis disconnected")
            
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

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")

# Add root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Perception AI Chat API with Authentication",
        "version": settings.APP_VERSION,
        "docs_url": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "endpoints": {
            "auth": {
                "signup": "/api/v1/auth/signup",
                "login": "/api/v1/auth/login",
                "refresh": "/api/v1/auth/token/refresh",
                "profile": "/api/v1/auth/me",
                "logout": "/api/v1/auth/logout"
            },
            "chats": {
                "create": "POST /api/v1/chats",
                "list": "GET /api/v1/chats",
                "get": "GET /api/v1/chats/{id}",
                "update": "PATCH /api/v1/chats/{id}",
                "delete": "DELETE /api/v1/chats/{id}",
                "messages": "GET /api/v1/chats/{id}/messages",
                "send_message": "POST /api/v1/chats/{id}/message"
            }
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check API health status."""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected" if redis_client.connected else "unavailable"
    }

if __name__ == "__main__":
    print("Application started with Neon PostgreSQL backend")
