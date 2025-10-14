# app/models/user.py
"""
User model definition using SQLAlchemy.
Defines the database schema for user authentication and profile data.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from ..db.base import Base


class User(Base):
    """
    User model for authentication and user management.
    
    This model stores user account information including:
    - Authentication credentials (email, hashed password)
    - Account metadata (creation time, active status)
    - User profile information
    
    Attributes:
        id: Primary key, unique user identifier
        email: User's email address (unique, used for login)
        hashed_password: Securely hashed password using bcrypt
        first_name: User's first name (optional)
        last_name: User's last name (optional)
        is_active: Whether the user account is active
        is_verified: Whether the user email is verified
        created_at: Timestamp when account was created
        updated_at: Timestamp when account was last updated
        last_login: Timestamp of last successful login
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(
        Integer, 
        primary_key=True, 
        index=True,
        comment="Unique user identifier"
    )
    
    # Authentication Fields
    email = Column(
        String(255), 
        unique=True, 
        index=True, 
        nullable=False,
        comment="User email address (unique, used for login)"
    )
    
    hashed_password = Column(
        String(255), 
        nullable=False,
        comment="Securely hashed password using bcrypt"
    )
    
    # Profile Information
    first_name = Column(
        String(100),
        nullable=True,
        comment="User's first name"
    )
    
    last_name = Column(
        String(100),
        nullable=True,
        comment="User's last name"
    )
    
    # Account Status Fields
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the user account is active"
    )
    
    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the user email is verified"
    )
    
    # Timestamp Fields
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when account was created"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Timestamp when account was last updated"
    )
    
    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of last successful login"
    )
    
    # Database Indexes for Performance
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_active', 'is_active'),
        Index('idx_user_created', 'created_at'),
    )
    
    def __repr__(self) -> str:
        """String representation of User model."""
        return f"<User(id={self.id}, email='{self.email}', active={self.is_active})>"
    
    @property
    def full_name(self) -> Optional[str]:
        """Get user's full name if available."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return None
    
    @property
    def display_name(self) -> str:
        """Get display name (full name or email)."""
        return self.full_name or self.email
    
    def update_last_login(self) -> None:
        """Update the last_login timestamp to current time."""
        self.last_login = datetime.utcnow()
    
    def deactivate(self) -> None:
        """Deactivate the user account."""
        self.is_active = False
    
    def activate(self) -> None:
        """Activate the user account."""
        self.is_active = True
    
    def verify_email(self) -> None:
        """Mark the user's email as verified."""
        self.is_verified = True