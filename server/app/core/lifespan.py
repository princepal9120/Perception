"""Application lifespan management and service initialization."""
import inspect
import os
import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI
from langgraph.checkpoint.postgres import PostgresSaver

from app.db.session import create_tables, check_database_connection, close_database_connection
from app.core.config import settings
from app.services.redis_utils import redis_client
from app.services.mcp_client_manager import mcp_manager
from app.models.mcp_schemas import MCPServerConfig
from app.services.llm_service import LLMService
from app.routes.chat_routes import set_llm_client
from app.graph.builder import build_graph

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


def _checkpoint_database_url() -> str | None:
    """Convert SQLAlchemy async URLs into a PostgresSaver-compatible connection string."""
    if not DATABASE_URL:
        return None
    return DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)


class ServiceManager:
    """Manages application services and their lifecycle."""

    def __init__(self):
        self.llm_service = None
        self.service_config = {
            "debug": settings.DEBUG,
            "database_url": DATABASE_URL,
            "redis_connected": False,
        }

    async def initialize(self, graph_instance):
        """Initialize all services with proper dependency injection."""
        try:
            self.llm_service = LLMService(graph_instance, self.service_config)
            set_llm_client(self.llm_service)
            logger.info("Services initialized successfully")
            logger.info(
                f"Available industries: {self.llm_service.service_factory.get_available_industries()}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
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


def _get_default_mcp_servers() -> List[MCPServerConfig]:
    """Get default MCP server configurations."""
    return [
        MCPServerConfig(
            name="perplexity",
            command=["npx", "-y", "@perplexity/mcp-server"],
            env={"PERPLEXITY_API_KEY": os.getenv("PERPLEXITY_API_KEY", "")},
            enabled=bool(os.getenv("PERPLEXITY_API_KEY")),
        ),
        MCPServerConfig(
            name="github",
            command=["npx", "-y", "@modelcontextprotocol/server-github"],
            env={"GITHUB_TOKEN": os.getenv("GITHUB_TOKEN", "")},
            enabled=bool(os.getenv("GITHUB_TOKEN")),
        ),
    ]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown."""
    postgres_cm = None
    saver = None
    graph = None

    logger.info("Starting Perception API")

    try:
        # Check database connection
        logger.info("Checking database connection...")
        db_connected = await check_database_connection()
        if not db_connected:
            logger.error("Database connection failed")
            raise Exception("Database connection failed")

        # NOTE: In production, use `alembic upgrade head` instead of create_tables().
        # create_tables() is kept as a convenience for development.
        logger.info("Creating database tables...")
        await create_tables()
        logger.info("Database tables created successfully")

        # Connect to Redis
        logger.info("Connecting to Redis...")
        await redis_client.connect()
        if redis_client.connected:
            logger.info("Redis connected successfully")
        else:
            logger.warning("Running without Redis cache")

        # Build the graph
        graph_builder = build_graph()

        # Initialize PostgresSaver with context manager for chat
        logger.info("Connecting to PostgreSQL for LangGraph checkpointing...")
        try:
            checkpoint_database_url = _checkpoint_database_url()
            postgres_cm = PostgresSaver.from_conn_string(checkpoint_database_url)
            if hasattr(postgres_cm, "__aenter__"):
                saver = await postgres_cm.__aenter__()
            else:
                saver = postgres_cm.__enter__()

            setup_result = saver.setup()
            if inspect.isawaitable(setup_result):
                await setup_result
            logger.info("LangGraph checkpoint tables set up successfully")

            graph = graph_builder.compile(checkpointer=saver)
            logger.info("Graph compiled with PostgreSQL checkpointer")

            await service_manager.initialize(graph)

            # Initialize MCP Manager with default servers
            logger.info("Initializing MCP Client Manager...")
            await mcp_manager.load_config(_get_default_mcp_servers())

            logger.info("Application startup completed successfully")
            yield

        except Exception as e:
            logger.error(f"Failed to setup PostgreSQL checkpointer: {e}")
            logger.warning("Using in-memory checkpointer as fallback")

            # Clean up failed postgres context manager
            if postgres_cm and saver and isinstance(saver, PostgresSaver):
                try:
                    if hasattr(postgres_cm, "__aexit__"):
                        await postgres_cm.__aexit__(None, None, None)
                    else:
                        postgres_cm.__exit__(None, None, None)
                    logger.info("PostgreSQL checkpointer context exited")
                except Exception as ex:
                    logger.error(f"Error closing PostgreSQL checkpointer: {ex}")
                postgres_cm = None
                saver = None

            # Fallback to in-memory checkpointer
            from langgraph.checkpoint.memory import MemorySaver

            saver = MemorySaver()
            graph = graph_builder.compile(checkpointer=saver)
            logger.info("Graph compiled with in-memory checkpointer")

            await service_manager.initialize(graph)

            # Initialize MCP Manager with default servers (fallback path)
            logger.info("Initializing MCP Client Manager (fallback)...")
            await mcp_manager.load_config(_get_default_mcp_servers())

            yield

    except Exception as e:
        logger.error(f"Critical startup error: {e}")
        raise
    finally:
        # Shutdown logic
        logger.info("Shutting down application...")

        try:
            await mcp_manager.cleanup()
            logger.info("MCP connections closed")

            if postgres_cm is not None and saver and isinstance(saver, PostgresSaver):
                try:
                    if hasattr(postgres_cm, "__aexit__"):
                        await postgres_cm.__aexit__(None, None, None)
                    else:
                        postgres_cm.__exit__(None, None, None)
                    logger.info("PostgreSQL checkpointer closed")
                except Exception as ex:
                    logger.error(f"Error closing PostgreSQL checkpointer during shutdown: {ex}")

            await redis_client.disconnect()
            logger.info("Redis disconnected")

            await close_database_connection()
            logger.info("Database connections closed and engine disposed")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

        logger.info("Application shutdown completed")
