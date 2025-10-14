# app/routers/auth.py
"""
Authentication router containing all auth-related endpoints.
Handles user signup, login, logout, and protected routes with JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from typing import Optional, Annotated
import logging

# Internal imports
from ..db.session import get_db
from ..models.user import User
from ..schemas.user_simple import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    Token, 
    APIResponse, 
    UserProfile,
    ChangePassword
)
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_access_token
)
from ..core.config import settings
from ..utils.session_manager import session_manager

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

# Security scheme for JWT
security = HTTPBearer(auto_error=False)


# Dependency for getting current user from JWT token
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to extract and validate current user from JWT token.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        db: Database session
        
    Returns:
        User object if authentication is successful
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    if not await session_manager.validate_jwt_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify and decode JWT token
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        # Get user from database
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        return user
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise credentials_exception


# Dependency for active user (must be active and verified)
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active and verified.
    
    Args:
        current_user: Current user from JWT token
        
    Returns:
        Active user object
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return current_user


@router.post("/signup", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """
    Register a new user account.
    
    Creates a new user with validated email and secure password.
    Checks for email uniqueness and handles validation errors.
    
    Args:
        user_data: User registration data
        request: FastAPI request object
        db: Database session
        
    Returns:
        API response with success status and user information
        
    Raises:
        HTTPException: If email already exists or validation fails
    """
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered"
            )
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=False  # Email verification can be implemented later
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"New user created: {new_user.email} (ID: {new_user.id})")
        
        return APIResponse(
            success=True,
            message="User account created successfully",
            data={
                "user_id": new_user.id,
                "email": new_user.email,
                "created_at": new_user.created_at.isoformat()
            }
        )
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Token:
    """
    Authenticate user and return JWT tokens.
    
    Validates credentials and creates session with JWT access and refresh tokens.
    
    Args:
        user_credentials: Login credentials (email, password)
        request: FastAPI request object
        db: Database session
        
    Returns:
        Token response with JWT and user information
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Get user by email
    result = await db.execute(select(User).where(User.email == user_credentials.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    try:
        # Create JWT tokens
        token_data = {"sub": str(user.id), "email": user.email}
        
        # Determine token expiry
        expires_delta = None
        if user_credentials.remember_me:
            expires_delta = timedelta(days=7)  # 7 days for remember me
        
        access_token = create_access_token(token_data, expires_delta)
        refresh_token = create_refresh_token(token_data)
        
        # Get client information
        user_agent = request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None
        
        # Create session
        session_expiry = 604800 if user_credentials.remember_me else 3600  # 7 days or 1 hour
        session = await session_manager.create_session(
            user_id=user.id,
            email=user.email,
            jwt_token=access_token,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=client_ip,
            expires_in=session_expiry
        )
        
        # Update user's last login time
        user.update_last_login()
        await db.commit()
        
        # Prepare user response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login,
            full_name=user.full_name
        )
        
        logger.info(f"User logged in: {user.email} (Session: {session.session_id})")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_EXPIRY_MINUTES * 60,
            user=user_response
        )
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


@router.post("/logout", response_model=APIResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> APIResponse:
    """
    Logout user and invalidate session.
    
    Blacklists the current JWT token and removes the user session.
    
    Args:
        request: FastAPI request object
        current_user: Current authenticated user
        credentials: JWT credentials
        
    Returns:
        API response confirming logout
    """
    try:
        token = credentials.credentials
        
        # Blacklist the JWT token
        await session_manager.blacklist_jwt_token(token)
        
        # Get and invalidate user session
        session = await session_manager.get_session_by_user_id(current_user.id)
        if session:
            await session_manager.invalidate_session(session.session_id)
        
        logger.info(f"User logged out: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Successfully logged out"
        )
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during logout"
        )


@router.post("/logout-all", response_model=APIResponse)
async def logout_all_sessions(
    current_user: User = Depends(get_current_active_user)
) -> APIResponse:
    """
    Logout user from all sessions.
    
    Invalidates all sessions and tokens for the current user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        API response with number of sessions invalidated
    """
    try:
        # Invalidate all user sessions
        sessions_count = await session_manager.invalidate_user_sessions(current_user.id)
        
        logger.info(f"All sessions logged out for user: {current_user.email} ({sessions_count} sessions)")
        
        return APIResponse(
            success=True,
            message=f"Successfully logged out from {sessions_count} sessions",
            data={"sessions_invalidated": sessions_count}
        )
        
    except Exception as e:
        logger.error(f"Logout all error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during logout"
        )


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_active_user)
) -> UserProfile:
    """
    Get current user's profile information.
    
    Protected endpoint that returns detailed user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile data
    """
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        full_name=current_user.full_name
    )


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserCreate,  # You might want to create a separate UpdateProfile schema
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """
    Update current user's profile information.
    
    Args:
        profile_data: Updated profile information
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated user information
    """
    try:
        # Update user fields
        if profile_data.first_name is not None:
            current_user.first_name = profile_data.first_name
        if profile_data.last_name is not None:
            current_user.last_name = profile_data.last_name
        if profile_data.email != current_user.email:
            # Check if new email is available
            result = await db.execute(select(User).where(User.email == profile_data.email))
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email address already in use"
                )
            current_user.email = profile_data.email
        
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"Profile updated for user: {current_user.email}")
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
            last_login=current_user.last_login,
            full_name=current_user.full_name
        )
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during profile update"
        )


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """
    Change user's password.
    
    Args:
        password_data: Current and new password data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        API response confirming password change
    """
    try:
        # Verify current password
        if not verify_password(password_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_hashed_password = hash_password(password_data.new_password)
        current_user.hashed_password = new_hashed_password
        
        await db.commit()
        
        # Invalidate all user sessions for security
        await session_manager.invalidate_user_sessions(current_user.id)
        
        logger.info(f"Password changed for user: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Password changed successfully. Please login again with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Password change error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during password change"
        )


@router.get("/sessions", response_model=dict)
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    Get user's active sessions.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Dictionary with session information
    """
    try:
        session = await session_manager.get_session_by_user_id(current_user.id)
        
        if session:
            return {
                "active_sessions": 1,
                "current_session": {
                    "session_id": session.session_id,
                    "created_at": session.created_at.isoformat(),
                    "last_accessed": session.last_accessed.isoformat(),
                    "expires_at": session.expires_at.isoformat(),
                    "user_agent": session.user_agent,
                    "ip_address": session.ip_address
                }
            }
        else:
            return {"active_sessions": 0}
            
    except Exception as e:
        logger.error(f"Get sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Health check endpoint for authentication service
@router.get("/health", response_model=dict)
async def auth_health_check() -> dict:
    """
    Health check endpoint for authentication service.
    
    Returns:
        Service status and statistics
    """
    try:
        stats = await session_manager.get_session_stats()
        
        return {
            "status": "healthy",
            "service": "authentication",
            "timestamp": datetime.utcnow().isoformat(),
            "session_stats": stats
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "service": "authentication",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }