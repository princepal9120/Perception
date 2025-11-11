"""
Core configuration settings for the application.
Loads environment variables and provides centralized configuration.
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Configuration
    APP_NAME: str = "Perception AI Chat API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    
    # Rate Limiting
    RATE_LIMIT_MESSAGES_PER_MINUTE: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    
    # Cache Settings
    CACHE_MAX_MESSAGES: int = 100
    SESSION_CACHE_TTL: int = 3600  # 1 hour
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ]
    
    # LLM Configuration
    GROQ_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    
    # Validation
    MIN_USERNAME_LENGTH: int = 3
    MAX_USERNAME_LENGTH: int = 30
    MIN_PASSWORD_LENGTH: int = 8
    MAX_PASSWORD_LENGTH: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
