# app/schemas/user_simple.py
"""
Simplified Pydantic schemas for user-related API requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User's email address")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's last name")


class UserCreate(UserBase):
    """Schema for user registration/signup requests."""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    def validate_passwords_match(self):
        """Validate that passwords match."""
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return True


class UserLogin(BaseModel):
    """Schema for user login requests."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    remember_me: Optional[bool] = Field(False, description="Keep user logged in for longer")


class UserResponse(UserBase):
    """Schema for user data in API responses."""
    id: int = Field(..., description="User's unique identifier")
    is_active: bool = Field(..., description="Whether the user account is active")
    is_verified: bool = Field(..., description="Whether the user email is verified")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last account update timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    full_name: Optional[str] = Field(None, description="User's full name")
    
    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """Extended user profile schema."""
    pass


class Token(BaseModel):
    """Schema for JWT token responses."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry time in seconds")
    user: UserResponse = Field(..., description="User information")


class ChangePassword(BaseModel):
    """Schema for changing user password."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")


class APIResponse(BaseModel):
    """Generic API response schema."""
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[dict] = Field(None, description="Response data")