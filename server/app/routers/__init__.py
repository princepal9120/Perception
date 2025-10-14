# app/routers/__init__.py
"""
Routers package containing API endpoint definitions.
"""

from .auth import router as auth_router

__all__ = ["auth_router"]