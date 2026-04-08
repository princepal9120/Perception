# main.py
"""
FastAPI application entry point.
Configures middleware, routers, and top-level endpoints.
"""

import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.lifespan import lifespan, service_manager
from app.core.logging_config import setup_logging
from app.core.middleware import RequestIDMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.services.redis_utils import redis_client

# Route imports
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router
from app.routes.document_routes import router as document_router
from app.routes.voice_routes import router as voice_router
from app.routes.tree_routes import router as tree_router
from app.routes.deep_research_routes import router as deep_research_router
from app.routes.mcp_routes import router as mcp_router

# Configure structured logging with request ID correlation
setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)

# -------------------
# FastAPI App
# -------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI application with JWT authentication and LangGraph chat capabilities",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware stack (Starlette executes in REVERSE order of add_middleware)
# Execution order: RequestID → Logging → Session → CORS → SecurityHeaders → App
# ---------------------------------------------------------------------------

# 5. Security headers — runs INSIDE CORS so it never strips CORS headers
app.add_middleware(SecurityHeadersMiddleware, debug=settings.DEBUG)

# 4. CORS — must be the outermost "real" middleware so preflight OPTIONS
#    requests are handled before anything else touches the response.
_is_wildcard_cors = settings.CORS_ORIGINS == ["*"]
_cors_origins = ["*"] if _is_wildcard_cors else settings.CORS_ORIGINS
logger.info(f"CORS origins: {_cors_origins} (credentials={'off' if _is_wildcard_cors else 'on'})")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=not _is_wildcard_cors,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 3. Session
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=3600,
    same_site="lax",
    https_only=not settings.DEBUG,
)

# 2. Request logging
app.add_middleware(RequestLoggingMiddleware)

# 1. Request ID — outermost, sets ID before anything else
app.add_middleware(RequestIDMiddleware)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(document_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1/voice", tags=["Voice"])
app.include_router(tree_router, prefix="/api/v1")
app.include_router(mcp_router, prefix="/api/v1")
app.include_router(deep_research_router)


# -------------------
# Exception Handlers
# -------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Custom handler for validation errors to provide user-friendly messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"] if loc != "body")
        message = error["msg"]
        error_type = error["type"]

        if error_type == "string_too_short":
            ctx = error.get("ctx", {})
            min_length = ctx.get("min_length", "required")
            errors.append(f"{field}: Must be at least {min_length} characters long")
        elif error_type == "string_too_long":
            ctx = error.get("ctx", {})
            max_length = ctx.get("max_length", "allowed")
            errors.append(f"{field}: Must be at most {max_length} characters long")
        elif error_type == "value_error":
            errors.append(f"{field}: {message}")
        elif error_type == "missing":
            errors.append(f"{field}: This field is required")
        else:
            errors.append(f"{field}: {message}")

    return JSONResponse(
        status_code=422,
        content={
            "detail": " | ".join(errors) if errors else "Validation error",
            "errors": errors,
        },
    )


# -------------------
# Endpoints
# -------------------
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Perception AI Chat API",
        "version": settings.APP_VERSION,
        "auth_mode": settings.AUTH_MODE,
        "model_provider": settings.MODEL_PROVIDER,
        "search_provider": settings.SEARCH_PROVIDER,
        "docs_url": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "endpoints": {
            "auth": {
                "signup": "/api/v1/auth/signup",
                "login": "/api/v1/auth/login",
                "refresh": "/api/v1/auth/token/refresh",
                "profile": "/api/v1/auth/me",
                "logout": "/api/v1/auth/logout",
            },
            "chats": {
                "create": "POST /api/v1/chats",
                "list": "GET /api/v1/chats",
                "get": "GET /api/v1/chats/{id}",
                "update": "PATCH /api/v1/chats/{id}",
                "delete": "DELETE /api/v1/chats/{id}",
                "messages": "GET /api/v1/chats/{id}/messages",
                "send_message": "POST /api/v1/chats/{id}/message",
            },
            "documents": {
                "upload": "POST /api/v1/documents/upload/{chat_id}",
                "list": "GET /api/v1/documents",
                "chat_documents": "GET /api/v1/documents/chat/{chat_id}",
                "get": "GET /api/v1/documents/{id}",
                "delete": "DELETE /api/v1/documents/{id}",
                "batch_delete": "POST /api/v1/documents/batch-delete",
                "health": "GET /api/v1/documents/health",
            },
            "services": {
                "health": "/api/v1/services/health",
                "info": "/api/v1/services/info",
                "industries": "/api/v1/services/industries",
            },
        },
    }


@app.get("/health")
async def health_check():
    """Check API health status."""
    basic_health = {
        "status": "healthy",
        "database": "connected",
        "redis": "connected" if redis_client.connected else "unavailable",
        "cors_origins": settings.CORS_ORIGINS,
        "auth_mode": settings.AUTH_MODE,
        "model_provider": settings.MODEL_PROVIDER,
        "search_provider": settings.SEARCH_PROVIDER,
    }

    try:
        service_health = await service_manager.health_check()
        basic_health["services"] = service_health
    except Exception as e:
        basic_health["services"] = {"error": str(e)}

    return basic_health


@app.get("/api/v1/services/info")
async def get_services_info():
    """Get comprehensive service information."""
    try:
        return await service_manager.get_service_info()
    except Exception as e:
        return {"error": str(e), "status": "unavailable"}


@app.get("/api/v1/services/industries")
async def get_available_industries():
    """Get list of available industries."""
    try:
        if service_manager.llm_service:
            industries = service_manager.llm_service.service_factory.get_available_industries()
            return {"industries": industries, "total": len(industries)}
        return {"industries": [], "total": 0}
    except Exception as e:
        return {"error": str(e), "industries": []}


@app.get("/api/v1/services/health")
async def services_health():
    """Detailed health check for all services."""
    try:
        return await service_manager.health_check()
    except Exception as e:
        return {"error": str(e), "status": "unhealthy"}


if __name__ == "__main__":
    import uvicorn

    logger.info("Application started with Neon PostgreSQL backend")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info",
    )
