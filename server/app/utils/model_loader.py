"""
Model loader that respects the configured OSS provider settings.
"""

from __future__ import annotations

import sys

from app.logger import GLOBAL_LOGGER as log
from app.logger.custom_exception import DocumentPortalException
from app.services.provider_factory import create_chat_model, create_embedding_model
from app.utils.config_loader import load_config


class ModelLoader:
    """
    Loads embedding models and LLMs based on app configuration.
    """

    def __init__(self):
        try:
            self.config = load_config()
            log.info("YAML config loaded", config_keys=list(self.config.keys()))
        except FileNotFoundError as e:
            log.error(f"Configuration file error: {e}")
            raise DocumentPortalException(
                "Failed to load configuration file. Please ensure app/config/conf.yaml exists.",
                sys,
            ) from e
        except Exception as e:
            log.error(f"Error loading configuration: {e}")
            raise DocumentPortalException("Configuration loading failed", sys) from e

    def get_embedding_dimension(self) -> int:
        """
        Get the embedding dimension from config.
        """
        return self.config.get("embedding_model", {}).get("dimension", 1536)

    def load_embeddings(self):
        """
        Load and return the configured embedding model.
        """
        try:
            embeddings = create_embedding_model()
            log.info("Loaded embedding provider", provider=type(embeddings).__name__)
            return embeddings
        except Exception as e:
            log.error("Error loading embedding model", error=str(e))
            raise DocumentPortalException("Failed to load embedding model", sys) from e

    def load_llm(self):
        """
        Load and return the configured LLM model.
        """
        try:
            llm = create_chat_model()
            log.info("Loaded chat model provider", provider=type(llm).__name__)
            return llm
        except Exception as e:
            log.error("Error loading LLM", error=str(e))
            raise DocumentPortalException("Failed to load LLM", sys) from e
