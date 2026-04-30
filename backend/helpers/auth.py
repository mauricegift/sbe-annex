"""
FastAPI dependency helpers for authentication and authorization.
"""
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from db.database import db
from lib.security import decode_token

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        username: str = payload.get("sub")
        if not username:
            raise exc
    except jwt.PyJWTError:
        raise exc

    user = await db.users.find_one({"username": username})
    if not user:
        raise exc

    if user.get("is_disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled. Please contact an administrator.",
        )
    return user


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_super_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super-admin access required",
        )
    return current_user
