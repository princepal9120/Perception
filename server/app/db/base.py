# app/db/base.py
"""
SQLAlchemy base configuration and declarative base.
This module sets up the foundation for all database models.
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    
    This class provides:
    - Common configuration for all models
    - Automatic table naming convention
    - Shared functionality across models
    """
    pass


# Alternative declarative base (legacy support)
# Can be used if DeclarativeBase causes issues
# Base = declarative_base()