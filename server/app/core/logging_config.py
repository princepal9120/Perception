"""Structured logging configuration."""

import logging
import sys

from app.core.middleware import request_id_var


class RequestIDFilter(logging.Filter):
    """Add request_id to all log records."""

    def filter(self, record):
        record.request_id = request_id_var.get("")
        return True


def setup_logging(debug: bool = False) -> None:
    """Configure structured logging for the application."""
    log_level = logging.DEBUG if debug else logging.INFO

    # Format: timestamp - name - level - [request_id] - message
    log_format = "%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s"

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(logging.Formatter(log_format))
    handler.addFilter(RequestIDFilter())
    root_logger.addHandler(handler)

    # Quiet noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
