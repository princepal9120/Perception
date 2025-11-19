"""Logger module for the application."""
from logger.custom_logger import CustomLogger

# Create a global logger instance
_custom_logger = CustomLogger()
GLOBAL_LOGGER = _custom_logger.get_logger(__name__)

__all__ = ['GLOBAL_LOGGER', 'CustomLogger']
