# app/schemas/user.py
"""
Pydantic schemas for user-related API requests and responses.
Defines data validation and serialization models for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration for future role-based access control."""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class UserBase(BaseModel):
    """
    Base user schema with common fields.
    Contains fields that are shared across different user operations.
    """
    email: EmailStr = Field(..., description="User's email address")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's last name")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Ensure email is lowercase and properly formatted."""
        return v.lower().strip()
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v):
        """Validate and clean name fields."""
        if v is not None:
            v = v.strip()
            if not v:
                return None
            # Check for invalid characters
            if not v.replace(' ', '').replace('-', '').replace("'", '').isalpha():
                raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
        return v


class UserCreate(UserBase):
    """
    Schema for user registration/signup requests.
    Includes password field for account creation.
    """
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="User password (8-128 characters)"
    )
    confirm_password: str = Field(..., description="Password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        """Ensure password and confirm_password match."""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('password')
    def validate_password_complexity(cls, v):
        """Validate password complexity requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        
        # Check for at least one special character
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        
        return v


class UserLogin(BaseModel):
    """
    Schema for user login requests.
    Contains credentials needed for authentication.
    """
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    remember_me: Optional[bool] = Field(False, description="Keep user logged in for longer")
    
    @validator('email')
    def validate_email(cls, v):
        """Ensure email is lowercase."""
        return v.lower().strip()


class UserUpdate(BaseModel):
    """
    Schema for updating user profile information.
    All fields are optional to allow partial updates.
    """
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = Field(None, description="New email address")
    
    @validator('email')
    def validate_email(cls, v):
        """Ensure email is lowercase."""
        if v is not None:
            return v.lower().strip()
        return v


class UserResponse(UserBase):
    """
    Schema for user data in API responses.
    Contains all safe user information (no sensitive data).
    """
    id: int = Field(..., description="User's unique identifier")
    is_active: bool = Field(..., description="Whether the user account is active")
    is_verified: bool = Field(..., description="Whether the user email is verified")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last account update timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    full_name: Optional[str] = Field(None, description="User's full name")
    
    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserProfile(UserResponse):
    """
    Extended user profile schema with additional information.
    Used for detailed profile views.
    """
    pass  # Can be extended with additional profile fields in the future


class Token(BaseModel):
    """
    Schema for JWT token responses.
    Contains access token and metadata.
    """
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry time in seconds")
    user: UserResponse = Field(..., description="User information")


class TokenRefresh(BaseModel):
    """
    Schema for token refresh requests.
    """
    refresh_token: str = Field(..., description="Valid refresh token")


class PasswordReset(BaseModel):
    """
    Schema for password reset requests.
    """
    email: EmailStr = Field(..., description="User's email address")
    
    @validator('email')
    def validate_email(cls, v):
        """Ensure email is lowercase."""
        return v.lower().strip()


class PasswordResetConfirm(BaseModel):
    """
    Schema for password reset confirmation.
    """
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        """Ensure password and confirm_password match."""
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ChangePassword(BaseModel):
    """
    Schema for changing user password.
    """
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        """Ensure new_password and confirm_password match."""
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserListResponse(BaseModel):
    """
    Schema for paginated user list responses.
    """
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Number of users per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")


class APIResponse(BaseModel):
    """
    Generic API response schema.
    """
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[dict] = Field(None, description="Response data")
    errors: Optional[List[str]] = Field(None, description="List of error messages")