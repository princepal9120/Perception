"""
Core configuration settings for the application.
Loads environment variables and provides centralized configuration.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


def parse_cors_origins(v: str | list[str]) -> list[str]:
    """Parse CORS origins from comma-separated string or list."""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    return []


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Configuration
    APP_NAME: str = "Perception AI Chat API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENABLE_DOCS: bool = True

    # Runtime modes
    AUTH_MODE: str = "disabled"
    MODEL_PROVIDER: str = "openai_compatible"
    EMBEDDING_PROVIDER: str = "openai_compatible"
    SEARCH_PROVIDER: str = "duckduckgo"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_SECRET_KEY: str

    # Clerk Authentication
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Upstash Redis (REST API)
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    # Rate Limiting
    RATE_LIMIT_MESSAGES_PER_MINUTE: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Cache Settings
    CACHE_MAX_MESSAGES: int = 100
    SESSION_CACHE_TTL: int = 3600  # 1 hour

    # CORS - Can be set as comma-separated string in env: CORS_ORIGINS="https://app.example.com,https://www.example.com"
    # Use "*" to allow all origins (credentials will be disabled automatically)
    CORS_ORIGINS: list[str] = [
        "https://perception.princepal.dev",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v):
        return parse_cors_origins(v)

    @field_validator("AUTH_MODE", "MODEL_PROVIDER", "EMBEDDING_PROVIDER", "SEARCH_PROVIDER", mode="before")
    @classmethod
    def normalize_mode_values(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    # LLM Configuration
    GOOGLE_API_KEY: str = ""  # Gemini API
    GROQ_API_KEY: str = ""  # Fallback
    TAVILY_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    ELEVENLABS_API_KEY: str = ""
    ALPHA_VANTAGE_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""
    GITHUB_TOKEN: str = ""

    # Local OSS demo mode
    LOCAL_DEV_USER_NAME: str = "Local OSS User"
    LOCAL_DEV_USER_EMAIL: str = "local@perception.dev"
    LOCAL_DEV_TOKEN: str = "perception-local-dev-token"

    # Document Management
    UPLOAD_DIR: str = "uploads"
    FAISS_INDEX_DIR: str = "faiss_index"

    # Pinecone Configuration
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "quickstart"

    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_FILES_PER_UPLOAD: int = 10
    SUPPORTED_FILE_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".md"]

    # Vector Database Configuration
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    VECTOR_SEARCH_K: int = 5

    # Validation
    MIN_USERNAME_LENGTH: int = 3
    MAX_USERNAME_LENGTH: int = 30
    MIN_PASSWORD_LENGTH: int = 8
    MAX_PASSWORD_LENGTH: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

    def is_auth_disabled(self) -> bool:
        return self.AUTH_MODE == "disabled"

    def is_clerk_auth(self) -> bool:
        return self.AUTH_MODE == "clerk"

    def is_jwt_auth(self) -> bool:
        return self.AUTH_MODE == "jwt"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
