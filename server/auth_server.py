# auth_server.py
"""
FastAPI authentication server with JWT-based user management.
Production-ready authentication system following software engineering best practices.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

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
# Application Lifespan Management
# -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown operations.
    Handles database initialization, session management, and cleanup.
    """
    # --- Startup Operations ---
    logger.info("🚀 Starting Authentication API Server")
    
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
        
        logger.info("🎉 Authentication API startup completed successfully")
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # --- Shutdown Operations ---
        logger.info("🔄 Shutting down Authentication API...")
        
        try:
            # Stop session manager
            await session_manager.stop_cleanup_task()
            logger.info("✅ Session manager stopped")
            
            # Close database connections
            await close_database_connection()
            logger.info("✅ Database connections closed")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")
        
        logger.info("👋 Authentication API shutdown completed")

# -------------------
# FastAPI Application Configuration
# -------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-ready FastAPI authentication system with JWT tokens",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# -------------------
# Middleware Configuration
# -------------------

# Session Middleware for session management
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=3600,  # 1 hour session timeout
    same_site="lax",
    https_only=False  # Set to True in production with HTTPS
)

# CORS Middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# -------------------
# Route Registration
# -------------------

# Include authentication router
app.include_router(auth_router, prefix="/api/v1")

# -------------------
# Root and Health Endpoints
# -------------------

@app.get("/")
async def root():
    """
    Root endpoint providing API information and available endpoints.
    
    Returns:
        dict: API metadata and endpoint information
    """
    return {
        "message": "Perception Authentication API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs_url": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "endpoints": {
            "authentication": {
                "signup": "POST /api/v1/auth/signup",
                "login": "POST /api/v1/auth/login", 
                "logout": "POST /api/v1/auth/logout",
                "logout_all": "POST /api/v1/auth/logout-all",
                "profile": "GET /api/v1/auth/profile",
                "change_password": "POST /api/v1/auth/change-password",
                "sessions": "GET /api/v1/auth/sessions"
            },
            "health": {
                "api_health": "GET /health",
                "auth_health": "GET /api/v1/auth/health"
            }
        }
    }

@app.get("/health")
async def health_check():
    """
    General health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Service health status and basic metrics
    """
    try:
        # Check database connection
        db_healthy = await check_database_connection()
        
        # Get session statistics
        session_stats = await session_manager.get_session_stats()
        
        status = "healthy" if db_healthy else "degraded"
        
        return {
            "status": status,
            "service": "authentication-api",
            "version": settings.APP_VERSION,
            "database": "connected" if db_healthy else "disconnected",
            "session_manager": "active",
            "metrics": session_stats
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "authentication-api",
            "version": settings.APP_VERSION,
            "error": str(e)
        }

# -------------------
# Application Metadata
# -------------------

if __name__ == "__main__":
    import uvicorn
    
    # Development server configuration
    uvicorn.run(
        "auth_server:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )