"""
FastAPI dependencies for authentication and database access.
Supports both legacy JWT auth and Clerk authentication.
"""

import logging
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token, hash_password, verify_token_type
from app.db.session import get_db
from app.models.tables import User

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def decode_clerk_token(token: str) -> dict[str, Any]:
    """
    Decode a Clerk JWT token with basic validation.

    Note: Full JWKS signature verification requires the `clerk-backend-api`
    package or fetching keys from Clerk's JWKS endpoint. This implementation
    validates token expiry but does not verify the cryptographic signature.
    """
    try:
        unverified = jwt.get_unverified_claims(token)
        # Verify expiry
        import time

        exp = unverified.get("exp")
        if exp and exp < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return unverified
    except JWTError as e:
        logger.error(f"Clerk token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Clerk token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def is_clerk_token(token: str) -> bool:
    """Check if a token appears to be a Clerk JWT."""
    try:
        claims = jwt.get_unverified_claims(token)
        # Clerk tokens have 'azp' (authorized party) or sub starts with 'user_'
        return "azp" in claims or (claims.get("sub", "").startswith("user_"))
    except Exception:
        return False


async def get_or_create_clerk_user(clerk_user_id: str, email: str | None, name: str | None, db: AsyncSession) -> User:
    """Get existing user or create new one from Clerk user data."""

    # Generate a unique email based on clerk_user_id for consistent lookup
    clerk_email = f"{clerk_user_id}@clerk.local"

    # First, try to find by clerk email (most reliable for Clerk users)
    result = await db.execute(select(User).where(User.email == clerk_email))
    user = result.scalar_one_or_none()

    if user:
        logger.debug(f"Found existing Clerk user: {user.email}")
        return user

    # Also try real email if provided
    if email and email != clerk_email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            logger.debug(f"Found existing user by real email: {user.email}")
            return user

    # Create new user from Clerk data
    try:
        new_user = User(
            name=name or "Clerk User",
            email=clerk_email,  # Use clerk email for uniqueness
            password_hash="clerk_managed",
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        logger.info(f"Created new user from Clerk: {new_user.email} (ID: {new_user.id})")
        return new_user

    except Exception as e:
        await db.rollback()

        # If insert failed due to duplicate, try to fetch again
        logger.warning(f"User creation failed (may already exist): {e}")
        result = await db.execute(select(User).where(User.email == clerk_email))
        user = result.scalar_one_or_none()

        if user:
            return user

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create or find user")


async def get_or_create_local_dev_user(db: AsyncSession) -> User:
    """Get or create the local OSS demo user for AUTH_MODE=disabled."""
    result = await db.execute(select(User).where(User.email == settings.LOCAL_DEV_USER_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        return user

    user = User(
        name=settings.LOCAL_DEV_USER_NAME,
        email=settings.LOCAL_DEV_USER_EMAIL,
        password_hash=hash_password(settings.LOCAL_DEV_TOKEN),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info("Created local OSS demo user", extra={"user_id": user.id, "auth_mode": settings.AUTH_MODE})
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security), db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    Supports both legacy JWT and Clerk authentication.
    """
    if settings.is_auth_disabled():
        return await get_or_create_local_dev_user(db)

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Clerk auth mode only accepts Clerk-issued tokens
    if settings.is_clerk_auth():
        if not is_clerk_token(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            payload = decode_clerk_token(token)
            clerk_user_id = payload.get("sub")

            if not clerk_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Clerk token: missing user ID",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get user data from Clerk claims
            email = payload.get("email") or payload.get("primary_email")
            name = payload.get("name")
            if not name and "first_name" in payload:
                name = f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()

            # Get or create user
            user = await get_or_create_clerk_user(clerk_user_id, email, name, db)
            return user

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Clerk auth error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if settings.is_clerk_auth():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clerk authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Legacy JWT auth

    payload = decode_token(token)
    verify_token_type(payload, "access")

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    return current_user


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security), db: AsyncSession = Depends(get_db)
) -> User | None:
    """Get the current user if token is provided, None otherwise."""
    if settings.is_auth_disabled():
        return await get_or_create_local_dev_user(db)

    if credentials is None:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
