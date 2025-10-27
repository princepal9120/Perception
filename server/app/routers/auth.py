# app/routers/auth.py
"""
Authentication router for user signup, login, logout, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from typing import Annotated
import logging

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

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and validate current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    
    if not await session_manager.validate_jwt_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            raise credentials_exception
        
        return user
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise credentials_exception


@router.post("/signup", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Register a new user account."""
    try:
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        result = await db.execute(select(User).where(User.email == user_data.email.lower()))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered"
            )
        
        first_name = None
        last_name = None
        
        if user_data.full_name:
            name_parts = user_data.full_name.strip().split(maxsplit=1)
            first_name = name_parts[0] if len(name_parts) > 0 else None
            last_name = name_parts[1] if len(name_parts) > 1 else None
        
        if user_data.first_name:
            first_name = user_data.first_name
        if user_data.last_name:
            last_name = user_data.last_name
        
        new_user = User(
            email=user_data.email.lower(),
            hashed_password=hash_password(user_data.password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=False
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"New user created: {new_user.email}")
        
        return APIResponse(
            success=True,
            message="Account created successfully",
            data={
                "user_id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.full_name
            }
        )
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    except HTTPException:
        raise
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
    """Authenticate user and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == user_credentials.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    try:
        token_data = {"sub": str(user.id), "email": user.email}
        
        expires_delta = timedelta(days=7) if user_credentials.remember_me else None
        access_token = create_access_token(token_data, expires_delta)
        refresh_token = create_refresh_token(token_data)
        
        user_agent = request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None
        
        session_expiry = 604800 if user_credentials.remember_me else 3600
        await session_manager.create_session(
            user_id=user.id,
            email=user.email,
            jwt_token=access_token,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=client_ip,
            expires_in=session_expiry
        )
        
        user.update_last_login()
        await db.commit()
        
        logger.info(f"User logged in: {user.email}")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_EXPIRY_MINUTES * 60,
            user=UserResponse(
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
        )
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


@router.post("/logout", response_model=APIResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> APIResponse:
    """Logout user and invalidate session."""
    try:
        token = credentials.credentials
        await session_manager.blacklist_jwt_token(token)
        
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


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user)
) -> UserProfile:
    """Get current user's profile information."""
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


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> APIResponse:
    """Change user's password."""
    try:
        if not verify_password(password_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        current_user.hashed_password = hash_password(password_data.new_password)
        await db.commit()
        
        await session_manager.invalidate_user_sessions(current_user.id)
        
        logger.info(f"Password changed for user: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Password changed successfully. Please login again."
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


@router.get("/health", response_model=dict)
async def auth_health_check() -> dict:
    """Health check endpoint for authentication service."""
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