# app/core/config.py
"""
Configuration module for the FastAPI application.
Handles environment variables, database configuration, and JWT settings.
"""

import os
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class centralizes all configuration including:
    - Database connection settings
    - JWT authentication configuration 
    - Application metadata
    """
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/perception_db"
    )
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", 
        "your-super-secret-jwt-key-change-this-in-production"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", "30"))
    
    # Session Configuration
    SESSION_SECRET_KEY: str = os.getenv(
        "SESSION_SECRET_KEY", 
        "your-session-secret-key-change-this-in-production"
    )
    
    # Application Configuration
    APP_NAME: str = "Perception Authentication API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Configuration
    CORS_ORIGINS: list = [
        "http://localhost:3000",  # Next.js development server
        "http://localhost:8000",  # FastAPI development server
        "https://localhost:3000",
        "*"  # Allow all origins in development (restrict in production)
    ]
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v):
        """Ensure database URL is properly formatted for async PostgreSQL."""
        if v.startswith("postgresql://"):
            # Convert to asyncpg compatible URL
            return v.replace("postgresql://", "postgresql+asyncpg://")
        elif v.startswith("postgresql+asyncpg://"):
            return v
        else:
            raise ValueError("DATABASE_URL must start with postgresql://")
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v):
        """Ensure JWT secret key is secure enough."""
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()

# Database configuration helpers
def get_database_url() -> str:
    """Get the properly formatted database URL for SQLAlchemy."""
    return settings.DATABASE_URL

def get_jwt_settings() -> dict:
    """Get JWT configuration as a dictionary."""
    return {
        "secret_key": settings.JWT_SECRET_KEY,
        "algorithm": settings.JWT_ALGORITHM,
        "expiry_minutes": settings.JWT_EXPIRY_MINUTES
    }