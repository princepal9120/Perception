# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Builder Stage
# ------------------------------------------------------------------------------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

# Environment variables for uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

# Install dependencies
# Copy pyproject.toml and uv.lock first to leverage cache
COPY pyproject.toml uv.lock ./

# Sync dependencies
# --frozen: use uv.lock as source of truth
# --no-install-project: only install dependencies, not the project itself
# --no-dev: exclude dev dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY . .

# Install the project itself (if applicable) or just ensure everything is synced
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm

# Install system dependencies
# Include nodejs and npm for MCP servers, git for dependencies/runtime
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    git \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
