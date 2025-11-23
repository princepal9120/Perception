# main.py
"""
FastAPI application with industry-grade backend architecture.
Combines JWT-based authentication with LangGraph chat capabilities and modular service design.
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
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# LangGraph / LangChain
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage, BaseMessage, SystemMessage
from langchain_groq import ChatGroq

# Import tools
from tools import tools, tavily_tool, duck_tool, calculator, get_stock_price

# Authentication and route imports
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router, set_llm_client
from app.routes.document_routes import router as document_router
from app.db.session import create_tables, check_database_connection, close_database_connection
from app.core.config import settings
from app.services.redis_utils import redis_client
from app.services.llm_service import LLMService
from app.services.ingestion_service import ChatIngestor
from app.prompts.prompt_library import get_prompt

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
# 2. System Prompt (imported from prompt_library)
# -------------------
SYSTEM_PROMPT = get_prompt("perception_system")

# -------------------
# 3. LLM
# -------------------
llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")
llm_with_tools = llm.bind_tools(tools)

# -------------------
# 4. PostgreSQL Connection and Checkpointer
# -------------------
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Using DATABASE_URL: {DATABASE_URL}")

saver = None

# -------------------
# 5. Nodes
# -------------------
async def chat_node(state: ChatState):
    # Add system message if not present
    messages = state["messages"]
    
    # Check if system message is already present
    has_system = any(isinstance(msg, SystemMessage) for msg in messages)
    
    if not has_system:
        # Add system message at the beginning
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    
    result = await llm_with_tools.ainvoke(messages)
    return {"messages": [result]}

async def tools_router(state: ChatState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tool_node"
    return END

async def tool_node(state: ChatState, config):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []
    
    # Get chat_id from config
    chat_id = config.get("configurable", {}).get("chat_id")
    
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
        elif tool_name == "search_documents":
            logger.info(f"🔍 Executing search_documents tool. Chat ID: {chat_id}")
            if not chat_id:
                logger.error("❌ Chat context missing for search_documents")
                result = {"error": "Chat context required for document search"}
            else:
                try:
                    session_id = f"chat_{chat_id}"
                    logger.info(f"🔍 Initializing ChatIngestor for session: {session_id}")
                    
                    # Initialize ingestor with existing session
                    ingestor = ChatIngestor(
                        session_id=session_id,
                        use_session_dirs=True
                    )
                    
                    # Get retriever (passing empty list to load existing index)
                    logger.info("🔍 Building retriever...")
                    retriever = ingestor.built_retriver([])
                    
                    # Search
                    query = tool_args.get("query", "")
                    logger.info(f"🔍 Searching for: '{query}'")
                    docs = await retriever.ainvoke(query)
                    logger.info(f"✅ Found {len(docs)} documents")
                    
                    # Format results
                    results = []
                    for doc in docs:
                        results.append({
                            "content": doc.page_content,
                            "source": doc.metadata.get("source", "unknown"),
                            "page": doc.metadata.get("page", 0)
                        })
                    result = {"results": results}
                except Exception as e:
                    logger.error(f"❌ Search failed: {str(e)}", exc_info=True)
                    result = {"error": f"Search failed: {str(e)}"}
            
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
# 6. Graph
# -------------------
graph_builder = StateGraph(ChatState)
graph_builder.add_node("chat_node", chat_node)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("chat_node")
graph_builder.add_conditional_edges("chat_node", tools_router)
graph_builder.add_edge("tool_node", "chat_node")

# Graph will be compiled in lifespan
graph = None

# -------------------
# 7. Industry-Grade Service Management
# -------------------
class ServiceManager:
    """Manages industry-grade services and their lifecycle."""
    
    def __init__(self):
        self.llm_service = None
        self.service_config = {
            "debug": settings.DEBUG,
            "database_url": DATABASE_URL,
            "redis_connected": False
        }
    
    async def initialize(self, graph_instance):
        """Initialize all services with proper dependency injection."""
        try:
            # Initialize LLM service with graph
            self.llm_service = LLMService(graph_instance, self.service_config)
            
            # Set LLM client for chat routes
            set_llm_client(self.llm_service)
            
            logger.info("✅ Industry-grade services initialized successfully")
            logger.info(f"🏭 Available industries: {self.llm_service.service_factory.get_available_industries()}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize services: {e}")
            raise
    
    async def health_check(self):
        """Perform comprehensive health check of all services."""
        if self.llm_service:
            return await self.llm_service.get_service_health()
        return {"status": "not_initialized"}
    
    def get_service_info(self):
        """Get comprehensive service information."""
        if self.llm_service:
            return self.llm_service.get_service_info()
        return {"status": "not_initialized"}

# Global service manager
service_manager = ServiceManager()

# -------------------
# 8. Lifespan Context Manager
# -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global saver, graph
    
    # Initialize variables at the top level so they're accessible in finally
    postgres_cm = None
    
    # --- Startup logic ---
    logger.info("🚀 Starting Perception API with Industry-Grade Architecture")
    
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
        try:
            postgres_cm = PostgresSaver.from_conn_string(DATABASE_URL)
            saver = await postgres_cm.__aenter__()
            await saver.setup()
            logger.info("✅ LangGraph checkpoint tables set up successfully")
            
            # Compile graph with the initialized saver
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("✅ Graph compiled with PostgreSQL checkpointer")
            
            # Initialize industry-grade services
            await service_manager.initialize(graph)
            
            logger.info("🎉 Industry-grade application startup completed successfully")
            yield
            
        except Exception as e:
            logger.error(f"❌ Failed to setup PostgreSQL checkpointer: {e}")
            logger.warning("⚠️  Using in-memory checkpointer as fallback")
            
            # Ensure we exit the context manager if it was entered
            if postgres_cm and saver and isinstance(saver, PostgresSaver):
                try:
                    await postgres_cm.__aexit__(None, None, None)
                    logger.info("✅ PostgreSQL checkpointer context exited")
                except Exception as ex:
                    logger.error(f"Error closing PostgreSQL checkpointer: {ex}")
                postgres_cm = None
                saver = None

            # Fallback to in-memory checkpointer
            from langgraph.checkpoint.memory import MemorySaver
            saver = MemorySaver()
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("✅ Graph compiled with in-memory checkpointer")
            
            # Initialize services with fallback
            await service_manager.initialize(graph)
            
            yield
            
    except Exception as e:
        logger.error(f"❌ Critical startup error: {e}")
        raise
    finally:
        # --- Shutdown logic ---
        logger.info("🔄 Shutting down application...")
        
        try:
            # Close PostgresSaver context if active
            if postgres_cm is not None and saver and isinstance(saver, PostgresSaver):
                try:
                    await postgres_cm.__aexit__(None, None, None)
                    logger.info("✅ PostgreSQL checkpointer closed")
                except Exception as ex:
                    logger.error(f"Error closing PostgreSQL checkpointer during shutdown: {ex}")

            # Disconnect Redis
            await redis_client.disconnect()
            logger.info("✅ Redis disconnected")
            
            # Close database connections and dispose engine
            await close_database_connection()
            logger.info("✅ Database connections closed and engine disposed")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")
        
        logger.info("👋 Application shutdown completed")

# -------------------
# 9. FastAPI App Configuration
# -------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI application with JWT authentication, LangGraph chat capabilities, and industry-grade service architecture",
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
app.include_router(document_router, prefix="/api/v1")

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """
    Custom handler for validation errors to provide user-friendly messages.
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"] if loc != "body")
        message = error["msg"]
        error_type = error["type"]
        
        # Create user-friendly error messages
        if error_type == "string_too_short":
            ctx = error.get("ctx", {})
            min_length = ctx.get("min_length", "required")
            errors.append(f"{field}: Must be at least {min_length} characters long")
        elif error_type == "string_too_long":
            ctx = error.get("ctx", {})
            max_length = ctx.get("max_length", "allowed")
            errors.append(f"{field}: Must be at most {max_length} characters long")
        elif error_type == "value_error":
            # Custom validation errors (like password strength)
            errors.append(f"{field}: {message}")
        elif error_type == "missing":
            errors.append(f"{field}: This field is required")
        else:
            errors.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": " | ".join(errors) if errors else "Validation error",
            "errors": errors
        }
    )

# Add root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Perception AI Chat API with Industry-Grade Architecture",
        "version": settings.APP_VERSION,
        "architecture": "industry-grade",
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
            },
            "documents": {
                "upload": "POST /api/v1/documents/upload/{chat_id}",
                "list": "GET /api/v1/documents",
                "chat_documents": "GET /api/v1/documents/chat/{chat_id}",
                "get": "GET /api/v1/documents/{id}",
                "delete": "DELETE /api/v1/documents/{id}",
                "batch_delete": "POST /api/v1/documents/batch-delete",
                "health": "GET /api/v1/documents/health"
            },
            "services": {
                "health": "/api/v1/services/health",
                "info": "/api/v1/services/info",
                "industries": "/api/v1/services/industries"
            }
        }
    }

# Enhanced health check endpoint
@app.get("/health")
async def health_check():
    """Check API health status with industry-grade services."""
    basic_health = {
        "status": "healthy",
        "database": "connected",
        "redis": "connected" if redis_client.connected else "unavailable",
        "architecture": "industry-grade"
    }
    
    # Add service health if available
    try:
        service_health = await service_manager.health_check()
        basic_health["services"] = service_health
    except Exception as e:
        basic_health["services"] = {"error": str(e)}
    
    return basic_health

# Service information endpoint
@app.get("/api/v1/services/info")
async def get_services_info():
    """Get comprehensive service information."""
    try:
        return await service_manager.get_service_info()
    except Exception as e:
        return {"error": str(e), "status": "unavailable"}

# Available industries endpoint
@app.get("/api/v1/services/industries")
async def get_available_industries():
    """Get list of available industries."""
    try:
        if service_manager.llm_service:
            return {
                "industries": service_manager.llm_service.service_factory.get_available_industries(),
                "total": len(service_manager.llm_service.service_factory.get_available_industries())
            }
        return {"industries": [], "total": 0}
    except Exception as e:
        return {"error": str(e), "industries": []}

# Service health endpoint
@app.get("/api/v1/services/health")
async def services_health():
    """Detailed health check for all services."""
    try:
        return await service_manager.health_check()
    except Exception as e:
        return {"error": str(e), "status": "unhealthy"}

if __name__ == "__main__":
    print("Industry-Grade Application started with Neon PostgreSQL backend")
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
