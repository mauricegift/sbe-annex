"""
Verification flow helpers — cooldown enforcement, code generation,
link generation, and dispatching via email/SMS.
"""
import os
import logging
from datetime import datetime, timedelta

from helpers.utils import generate_otp
from lib.tokens import create_email_token
from utils.email_service import send_email_link
from utils.sms_service import send_sms_otp

logger = logging.getLogger(__name__)

RESEND_COOLDOWN_SECONDS: int = int(os.getenv("RESEND_COOLDOWN_SECONDS", "60"))
BASE_URL: str = os.getenv("BASE_URL", "https://bbmback.giftedtech.co.ke")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://bbm.giftedtech.co.ke")


def cooldown_remaining(last_sent_at: datetime | None) -> int:
    """Return seconds remaining in the resend cooldown (0 if no cooldown active)."""
    if not last_sent_at:
        return 0
    elapsed = (datetime.utcnow() - last_sent_at).total_seconds()
    remaining = RESEND_COOLDOWN_SECONDS - elapsed
    return max(0, int(remaining))


async def dispatch_signup_verification(user_data: dict) -> tuple[bool, str]:
    """
    Send the initial signup verification.
    - EMAIL → sends a link to BASE_URL/api/auth/verify-link?token=...
    - SMS   → sends a 6-digit code
    Returns (success: bool, method: str)
    """
    method = user_data.get("verification_method", "email")

    if method == "sms":
        code = user_data.get("verification_code")
        phone = user_data.get("phone_number")
        ok = await send_sms_otp(phone, code)
        return ok, "sms"
    else:
        token = create_email_token(user_data["email"], "verify")
        link = f"{FRONTEND_URL}/verify-email?token={token}"
        ok = await send_email_link(user_data["email"], user_data["username"], link, "verify")
        return ok, "email"


async def dispatch_resend_verification(user_data: dict) -> tuple[bool, str]:
    """
    Resend a verification — email or SMS.
    Email always generates a fresh link token (no stored code needed for email).
    SMS generates a fresh OTP code.
    Returns (success, method, new_code_for_sms_or_None).
    """
    method = user_data.get("verification_method", "email")

    if method == "sms":
        code = generate_otp()
        phone = user_data.get("phone_number")
        ok = await send_sms_otp(phone, code)
        return ok, "sms", code
    else:
        token = create_email_token(user_data["email"], "verify")
        link = f"{FRONTEND_URL}/verify-email?token={token}"
        ok = await send_email_link(user_data["email"], user_data["username"], link, "resend_verify")
        return ok, "email", None


async def dispatch_password_reset(user_data: dict) -> tuple[bool, str, str | None]:
    """
    Send a password reset.
    - EMAIL → link pointing to FRONTEND_URL/reset-password?token=...
    - SMS   → 6-digit code
    Returns (success, method, code_for_sms_or_None)
    """
    phone = user_data.get("phone_number")
    email = user_data.get("email")
    username = user_data.get("username", "")

    # Determine preferred method: if user has phone and used SMS, prefer SMS; else email
    method = user_data.get("verification_method", "email")

    if method == "sms" and phone:
        code = generate_otp()
        ok = await send_sms_otp(phone, code)
        return ok, "sms", code
    else:
        token = create_email_token(email, "reset")
        link = f"{FRONTEND_URL}/reset-password?token={token}"
        ok = await send_email_link(email, username, link, "reset")
        return ok, "email", None


async def dispatch_delete_confirmation(user_data: dict) -> tuple[bool, str, str | None]:
    """
    Send account deletion confirmation.
    - EMAIL → link
    - SMS   → code
    Returns (success, method, code_for_sms_or_None)
    """
    method = user_data.get("verification_method", "email")
    phone = user_data.get("phone_number")
    email = user_data.get("email")
    username = user_data.get("username", "")

    if method == "sms" and phone:
        code = generate_otp()
        ok = await send_sms_otp(phone, code)
        return ok, "sms", code
    else:
        token = create_email_token(email, "delete")
        link = f"{FRONTEND_URL}/confirm-delete?token={token}"
        ok = await send_email_link(email, username, link, "delete")
        return ok, "email", None
