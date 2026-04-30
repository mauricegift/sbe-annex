"""
User profile routes — profile view/update, password change,
email/phone change with verification, notification preferences,
account deletion request.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Form, HTTPException, status

from db.database import db
from helpers.auth import get_current_user
from helpers.utils import generate_otp
from lib.security import hash_password, verify_password
from models.user import (
    UserOut, UserProfile, PasswordChange, UpdatePhoneRequest, VerificationMethod,
    ChangeEmailRequest, ChangePhoneRequest, ConfirmContactCodeRequest, NotificationPreferencesUpdate,
)
from functions.verification import (
    cooldown_remaining, dispatch_delete_confirmation,
    dispatch_email_change, dispatch_phone_change_otp,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])


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


# ── Email change ──────────────────────────────────────────────────────────────────

@router.post("/request-email-change", response_model=Dict[str, Any])
async def request_email_change(
    body: ChangeEmailRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Request an email address change.
    Sends a confirmation link to the NEW email address.
    The change only takes effect when the link is clicked.
    """
    new_email = body.new_email.lower().strip()

    if new_email == current_user["email"].lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is the same as your current email.",
        )

    conflict = await db.users.find_one({"email": new_email})
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That email address is already in use.",
        )

    remaining = cooldown_remaining(current_user.get("email_change_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting again.",
        )

    ok, _ = await dispatch_email_change(current_user, new_email)

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "pending_email": new_email,
            "email_change_sent_at": datetime.utcnow(),
        }},
    )

    return {
        "message": f"A confirmation link has been sent to {new_email}. Click it to complete the email change.",
        "code_sent": ok,
    }


# ── Phone change ──────────────────────────────────────────────────────────────────

@router.post("/request-phone-change", response_model=Dict[str, Any])
async def request_phone_change(
    body: ChangePhoneRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Request a phone number change.
    Sends a 6-digit OTP to the NEW phone number.
    The change takes effect only after the OTP is confirmed.
    """
    new_phone = body.new_phone.strip()

    if new_phone == current_user.get("phone_number", ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New phone number is the same as your current phone number.",
        )

    conflict = await db.users.find_one({"phone_number": new_phone, "id": {"$ne": current_user["id"]}})
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That phone number is already in use.",
        )

    remaining = cooldown_remaining(current_user.get("phone_change_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting again.",
        )

    ok, _, code = await dispatch_phone_change_otp(new_phone)

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "pending_phone": new_phone,
            "phone_change_code": code,
            "phone_change_code_expires": datetime.utcnow() + timedelta(minutes=10),
            "phone_change_sent_at": datetime.utcnow(),
        }},
    )

    return {
        "message": f"A verification code has been sent to {new_phone}. Enter it below to confirm.",
        "code_sent": ok,
    }


@router.post("/confirm-phone-change", response_model=Dict[str, Any])
async def confirm_phone_change(
    body: ConfirmContactCodeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Confirm phone number change using the OTP sent to the new phone."""
    if not current_user.get("pending_phone"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending phone change request.",
        )

    if datetime.utcnow() > current_user.get("phone_change_code_expires", datetime.min):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    if current_user.get("phone_change_code") != body.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    new_phone = current_user["pending_phone"]
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {"phone_number": new_phone},
            "$unset": {
                "pending_phone": "",
                "phone_change_code": "",
                "phone_change_code_expires": "",
                "phone_change_sent_at": "",
            },
        },
    )

    updated = await db.users.find_one({"id": current_user["id"]})
    updated.pop("_id", None)
    updated.pop("password", None)
    return {**updated, "message": "Phone number updated successfully."}


# ── Notification preferences ──────────────────────────────────────────────────────

@router.put("/notification-preferences", response_model=Dict[str, Any])
async def update_notification_preferences(
    body: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the user's notification preferences."""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"notify_on_upload_decision": body.notify_on_upload_decision}},
    )
    return {
        "message": "Notification preferences saved.",
        "notify_on_upload_decision": body.notify_on_upload_decision,
    }
