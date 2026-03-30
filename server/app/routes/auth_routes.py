"""
Authentication routes for signup, login, token refresh, and user profile.
"""
import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tables import User
from app.models.schemas import (
    UserSignup, 
    UserLogin, 
    TokenResponse, 
    TokenRefresh, 
    UserResponse,
    ErrorResponse,
    SuccessResponse
)
from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    decode_token,
    verify_token_type
)
from app.core.dependencies import get_current_active_user
from app.db.session import get_db


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def signup(
    user_data: UserSignup,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    
    - **name**: User's full name (2-100 characters)
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    
    Returns JWT access and refresh tokens.
    """
    logger.info(f"Signup attempt for email: {user_data.email}")
    
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    logger.info(f"User created successfully: {new_user.name} (ID: {new_user.id})")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(new_user)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse}
    }
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT access (15min) and refresh (7d) tokens.
    """
    logger.info(f"Login attempt for email: {credentials.email}")
    
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password_hash):
        logger.warning(f"Failed login attempt for email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Check remember_me flag
    expires_delta = None
    if credentials.remember_me:
        expires_delta = timedelta(days=15)
        
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}, 
        expires_delta=expires_delta
    )
    
    logger.info(f"User logged in successfully: {user.name} (ID: {user.id})")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user)
    )


@router.post(
    "/token/refresh",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse}
    }
)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens.
    """
    # Decode and verify refresh token
    payload = decode_token(token_data.refresh_token)
    verify_token_type(payload, "refresh")
    
    # Extract user ID
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Convert string ID back to integer
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    # Verify user still exists
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    logger.info(f"Token refreshed for user: {user.name} (ID: {user.id})")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse}
    }
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT access token in Authorization header.
    """
    logger.info(f"Profile accessed by user: {current_user.name} (ID: {current_user.id})")
    return current_user


@router.post(
    "/logout",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK
)
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout current user.
    
    Note: With JWT, logout is handled client-side by removing tokens.
    This endpoint is provided for consistency and potential server-side token blacklisting.
    """
    logger.info(f"User logged out: {current_user.name} (ID: {current_user.id})")
    
    return SuccessResponse(
        message="Logged out successfully",
        data={"user_id": current_user.id}
    )
