# main_auth.py
"""
FastAPI application focused on authentication functionality.
Simplified version without LangGraph dependencies for testing.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # --- Startup logic ---
    logger.info("🚀 Starting Perception Authentication API")
    
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
        
        logger.info("🎉 Application startup completed successfully")
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to setup application: {e}")
        # Still start the app but with error state
        yield
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


# Create FastAPI app
app = FastAPI(
    title="Perception Authentication API",
    version="1.0.0",
    description="FastAPI application with JWT authentication",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add Session Middleware
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


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Perception Authentication API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "auth_endpoints": {
            "signup": "/api/v1/auth/signup",
            "login": "/api/v1/auth/login",
            "logout": "/api/v1/auth/logout",
            "profile": "/api/v1/auth/profile"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "authentication"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)