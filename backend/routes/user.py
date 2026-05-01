"""
User profile routes — profile view/update, password change,
email/phone change, account deletion request.
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from db.database import db
from helpers.auth import get_current_user
from helpers.utils import generate_otp
from lib.security import hash_password, verify_password
from lib.tokens import create_email_token, decode_email_token
from models.user import UserOut, UserProfile, PasswordChange, UpdatePhoneRequest, VerificationMethod
from functions.verification import cooldown_remaining, dispatch_delete_confirmation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://bbm.giftedtech.co.ke")
BASE_URL = os.getenv("BASE_URL", "https://bbmback.giftedtech.co.ke")


# ── Pydantic models for email/phone change ────────────────────────────────────

class EmailChangeRequest(BaseModel):
    new_email: EmailStr

class PhoneChangeRequest(BaseModel):
    new_phone: str = Field(..., pattern=r"^(07|01)[0-9]{8}$")

class PhoneChangeConfirm(BaseModel):
    code: str


@router.get("/profile", response_model=Dict[str, Any])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    current_user.pop("_id", None)
    current_user.pop("password", None)
    return current_user


@router.put("/profile", response_model=Dict[str, Any])
async def update_profile(
    profile: UserProfile,
    current_user: dict = Depends(get_current_user),
):
    """Update profile fields (name, year, semester, group, specialization, picture, phone)."""
    update_data = profile.dict(exclude_unset=True)
    update_data.pop("username", None)
    update_data.pop("email", None)

    # Validate group/specialization if provided
    if "group" in update_data and update_data["group"]:
        group_doc = await db.groups.find_one({"code": update_data["group"].upper()})
        if not group_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{update_data['group']}' does not exist.",
            )
        if "specialization" in update_data and update_data["specialization"]:
            if update_data["specialization"] not in group_doc.get("specializations", []):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Specialization '{update_data['specialization']}' is not valid for group '{update_data['group']}'.",
                )

    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": current_user["id"]})
    updated.pop("_id", None)
    updated.pop("password", None)
    return updated


@router.put("/change-password", response_model=Dict[str, str])
async def change_password(
    body: PasswordChange,
    current_user: dict = Depends(get_current_user),
):
    """Change the authenticated user's password."""
    if not verify_password(body.current_password, current_user["password"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(body.new_password)}},
    )
    return {"message": "Password changed successfully."}


@router.post("/update-profile-picture", response_model=Dict[str, str])
async def update_profile_picture(
    profile_picture_url: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """Update profile picture URL."""
    if not profile_picture_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid URL format.")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"profile_picture": profile_picture_url}},
    )
    return {"message": "Profile picture updated successfully."}


# ── Email change ──────────────────────────────────────────────────────────────

@router.post("/request-email-change", response_model=Dict[str, Any])
async def request_email_change(
    body: EmailChangeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Request an email address change. Sends a confirmation link to the new email."""
    new_email = str(body.new_email).lower()

    if new_email == current_user.get("email", "").lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is the same as your current email.",
        )

    # Check if new email is already in use
    conflict = await db.users.find_one({"email": new_email})
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That email address is already taken by another account.",
        )

    # Create a signed token carrying old + new email
    import jwt as _jwt
    import time
    SECRET_KEY = os.getenv("SECRET_KEY", "sbe-annex-secret-please-change-me")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    payload = {
        "type": "email_change",
        "old_email": current_user["email"],
        "new_email": new_email,
        "user_id": current_user["id"],
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
    }
    token = _jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    confirm_link = f"{BASE_URL}/api/user/confirm-email-change?token={token}"

    # Send confirmation email to the NEW email address
    try:
        from utils.email_service import send_email_link
        await send_email_link(new_email, current_user.get("username", ""), confirm_link, "email_change")
    except Exception as exc:
        logger.error("Failed to send email change link: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send confirmation email. Please try again later.",
        )

    # Store pending email on the user document
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"pending_email": new_email, "email_change_token": token}},
    )

    return {"message": f"A confirmation link has been sent to {new_email}. Click it to complete the change."}


@router.get("/confirm-email-change")
async def confirm_email_change(token: str):
    """Called when the user clicks the email-change confirmation link."""
    import jwt as _jwt
    SECRET_KEY = os.getenv("SECRET_KEY", "sbe-annex-secret-please-change-me")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    from fastapi.responses import RedirectResponse

    try:
        payload = _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except _jwt.ExpiredSignatureError:
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=expired")
    except _jwt.PyJWTError:
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=invalid")

    if payload.get("type") != "email_change":
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=invalid")

    old_email = payload.get("old_email")
    new_email = payload.get("new_email")
    user_id = payload.get("user_id")

    user = await db.users.find_one({"id": user_id})
    if not user:
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=invalid")

    # Verify the token still matches what we stored (prevents replay)
    if user.get("email_change_token") != token:
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=invalid")

    # Check new email is still free
    conflict = await db.users.find_one({"email": new_email})
    if conflict and conflict.get("id") != user_id:
        return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_change=taken")

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"email": new_email}, "$unset": {"pending_email": "", "email_change_token": ""}},
    )

    logger.info("Email changed for user %s: %s -> %s", user_id, old_email, new_email)
    return RedirectResponse(url=f"{FRONTEND_URL}/profile?email_changed=true")


# ── Phone change ──────────────────────────────────────────────────────────────

@router.post("/request-phone-change", response_model=Dict[str, Any])
async def request_phone_change(
    body: PhoneChangeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Request a phone number change. Sends an OTP to the new phone."""
    new_phone = body.new_phone

    if new_phone == current_user.get("phone_number"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New phone number is the same as your current one.",
        )

    # Check if phone is already in use
    conflict = await db.users.find_one({"phone_number": new_phone, "id": {"$ne": current_user["id"]}})
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That phone number is already registered to another account.",
        )

    # Rate limit — 60 seconds between requests
    last_sent = current_user.get("phone_change_code_sent_at")
    if last_sent:
        elapsed = (datetime.utcnow() - last_sent).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} second(s) before requesting again.",
            )

    code = generate_otp()
    code_expires = datetime.utcnow() + timedelta(minutes=10)

    try:
        from utils.sms_service import send_sms_otp
        ok = await send_sms_otp(new_phone, code)
    except Exception as exc:
        logger.error("Failed to send phone change OTP: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send SMS. Please try again later.",
        )

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "pending_phone": new_phone,
            "phone_change_code": code,
            "phone_change_code_expires": code_expires,
            "phone_change_code_sent_at": datetime.utcnow(),
        }},
    )

    return {"message": f"A verification code has been sent to {new_phone}.", "code_sent": ok}


@router.post("/confirm-phone-change", response_model=Dict[str, Any])
async def confirm_phone_change(
    body: PhoneChangeConfirm,
    current_user: dict = Depends(get_current_user),
):
    """Confirm phone number change using the OTP sent to the new number."""
    pending_phone = current_user.get("pending_phone")
    if not pending_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending phone change. Please request a phone number change first.",
        )

    code_expires = current_user.get("phone_change_code_expires")
    if not code_expires or datetime.utcnow() > code_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    stored_code = current_user.get("phone_change_code")
    # Allow dev bypass code
    if body.code != "000000" and body.code != stored_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    # Final conflict check
    conflict = await db.users.find_one({"phone_number": pending_phone, "id": {"$ne": current_user["id"]}})
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That phone number was just taken by another account. Please try a different number.",
        )

    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {"phone_number": pending_phone},
            "$unset": {
                "pending_phone": "",
                "phone_change_code": "",
                "phone_change_code_expires": "",
                "phone_change_code_sent_at": "",
            },
        },
    )

    logger.info("Phone changed for user %s to %s", current_user["id"], pending_phone)
    return {"message": "Phone number updated successfully.", "phone_number": pending_phone}


# ── Notification preferences ──────────────────────────────────────────────────

@router.put("/notification-preferences", response_model=Dict[str, Any])
async def update_notification_preferences(
    body: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    """Update user notification preferences."""
    allowed = {"notify_on_upload_decision"}
    update_data = {k: v for k, v in body.items() if k in allowed}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid preferences to update.")

    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": current_user["id"]})
    updated.pop("_id", None)
    updated.pop("password", None)
    return updated


# ── Account deletion ──────────────────────────────────────────────────────────

@router.post("/request-delete", response_model=Dict[str, Any])
async def request_account_deletion(
    current_user: dict = Depends(get_current_user),
):
    """Request account deletion — sends email link or SMS code."""
    if current_user.get("role") == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin accounts cannot be deleted through this endpoint.",
        )

    remaining = cooldown_remaining(current_user.get("delete_code_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting again.",
        )

    ok, method, code = await dispatch_delete_confirmation(current_user)

    update: dict = {"delete_code_sent_at": datetime.utcnow()}
    if code:
        update["delete_code"] = code
        update["delete_code_expires"] = datetime.utcnow() + timedelta(minutes=10)

    await db.users.update_one({"id": current_user["id"]}, {"$set": update})

    return {
        "message": (
            "A confirmation link has been sent to your email."
            if method == "email"
            else "A confirmation code has been sent via SMS."
        ),
        "code_sent": ok,
        "method": method,
    }
