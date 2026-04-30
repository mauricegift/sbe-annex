"""
User profile routes — profile view/update, password change,
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
from models.user import UserOut, UserProfile, PasswordChange, UpdatePhoneRequest, VerificationMethod
from functions.verification import cooldown_remaining, dispatch_delete_confirmation

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
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update profile picture — accepts URL string or base64 data URI."""
    profile_picture = body.get("profile_picture") or body.get("profile_picture_url", "")
    if not profile_picture:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="profile_picture is required.")
    if not profile_picture.startswith(("http://", "https://", "data:image/")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid picture format.")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"profile_picture": profile_picture}},
    )
    return {"message": "Profile picture updated successfully.", "profile_picture": profile_picture}


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
