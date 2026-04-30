"""
Short-lived JWT tokens for email verification links and password reset links.
"""
import os
import jwt
from datetime import datetime, timedelta

SECRET_KEY: str = os.getenv("SECRET_KEY", "sbe-annex-secret-please-change-me")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")


def create_email_token(email: str, token_type: str, expires_minutes: int = 10) -> str:
    """
    Create a short-lived token for email-based operations.
    token_type: 'verify' | 'reset'
    """
    payload = {
        "email": email,
        "type": token_type,
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_email_token(token: str) -> dict:
    """
    Decode and validate an email token.
    Returns the payload dict.
    Raises jwt.PyJWTError if invalid or expired.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
