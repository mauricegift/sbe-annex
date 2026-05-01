"""
Authentication routes — register, verify, resend, login, forgot/reset password,
account deletion. Email flows use links; SMS flows use OTP codes.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import EmailStr
import jwt

from db.database import db
from helpers.utils import generate_otp
from lib.security import hash_password, verify_password, create_access_token
from lib.tokens import create_email_token, decode_email_token
from models.user import (
    UserCreate,
    UserLogin,
    Token,
    PasswordReset,
    PasswordResetViaSmsConfirm,
    PasswordResetViaLinkConfirm,
    EmailVerification,
    AccountDeletion,
    VerificationMethod,
    UpdatePhoneRequest,
)
from functions.verification import (
    cooldown_remaining,
    dispatch_signup_verification,
    dispatch_resend_verification,
    dispatch_password_reset,
    dispatch_delete_confirmation,
)
import os
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://bbm.giftedtech.co.ke")


# ── Register ─────────────────────────────────────────────────────────────────────


@router.get("/check-first-user", response_model=Dict[str, Any])
async def check_first_user():
    """Check if this is the first user registration (for UI hints)."""
    count = await db.users.count_documents({})
    return {"is_first_user": count == 0}


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, request: Request):
    """
    Register a new user.
    - First ever user becomes super_admin automatically.
    - If mauricegift045@gmail.com already exists and no super_admin exists, they get promoted on startup.
    - Sends email verification LINK or SMS OTP based on chosen method.
    """
    # Check uniqueness
    existing = await db.users.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email},
            *([{"phone_number": user.phone_number}] if user.phone_number else []),
        ]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or phone number already registered",
        )

    # Get client IP for duplicate account prevention
    forwarded = request.headers.get("X-Forwarded-For", "")
    reg_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

    # Prevent multiple accounts from the same IP (skip for super admin email)
    if reg_ip and reg_ip != "unknown" and user.email != "mauricegift045@gmail.com":
        ip_conflict = await db.users.find_one({"registration_ip": reg_ip, "is_disabled": {"$ne": True}})
        if ip_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account has already been registered from your network. Please use your existing account or contact support.",
            )

    # Validate group/specialization against DB groups if provided
    if user.group:
        group_doc = await db.groups.find_one({"code": user.group.upper()})
        if not group_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{user.group}' does not exist. Contact admin.",
            )
        if user.specialization and user.specialization not in group_doc.get("specializations", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Specialization '{user.specialization}' is not valid for group '{user.group}'.",
            )

    # Determine role — first user ever is super_admin
    user_count = await db.users.count_documents({})
    if user_count == 0:
        role = "super_admin"
        is_admin = True
    else:
        role = "user"
        is_admin = False

    hashed = hash_password(user.password)
    code = generate_otp()  # used for SMS; email gets a link
    code_expires = datetime.utcnow() + timedelta(minutes=10)

    user_data = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "password": hashed,
        "year_of_study": user.year_of_study,
        "semester_of_study": user.semester_of_study,
        "group": user.group,
        "specialization": user.specialization,
        "profile_picture": None,
        "phone_number": user.phone_number,
        "verification_method": user.verification_method,
        "is_verified": False,
        "is_admin": is_admin,
        "role": role,
        "is_disabled": False,
        "created_at": datetime.utcnow(),
        "registration_ip": reg_ip,
        # SMS verification fields
        "verification_code": code,
        "code_expires": code_expires,
        "code_sent_at": datetime.utcnow(),
        # Reset / delete fields (cleared initially)
        "reset_code": None,
        "reset_code_expires": None,
        "reset_code_sent_at": None,
        "delete_code": None,
        "delete_code_expires": None,
        "delete_code_sent_at": None,
    }

    await db.users.insert_one(user_data)

    ok, method = await dispatch_signup_verification(user_data)

    return {
        "message": (
            "Registration successful. Check your email for a verification link."
            if method == "email"
            else "Registration successful. Check your SMS for a verification code."
        ),
        "code_sent": ok,
        "user_id": user_data["id"],
        "verification_method": method,
    }


# ── Verify via Link (email) ───────────────────────────────────────────────────────

@router.get("/verify-link")
async def verify_via_link(token: str):
    """
    Called when the user clicks the verification link in their email.
    Verifies the token, marks the account as verified, then redirects to frontend.
    """
    try:
        payload = decode_email_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification link.")

    if payload.get("type") != "verify":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid link type.")

    email = payload.get("email")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.get("is_verified"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{FRONTEND_URL}/login?verified=already")

    await db.users.update_one(
        {"email": email},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": "", "code_expires": ""}},
    )

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}/login?verified=true")


# ── Verify via SMS code ───────────────────────────────────────────────────────────

@router.post("/verify-sms", response_model=Dict[str, str])
async def verify_via_sms(verification: EmailVerification):
    """
    Verify account using SMS OTP code. identifier = email or phone number.
    """
    user = await db.users.find_one({
        "$or": [{"email": verification.identifier}, {"phone_number": verification.identifier}]
    })
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already verified.")

    if datetime.utcnow() > user.get("code_expires", datetime.min):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired.")

    # Dev bypass
    if verification.code != "000000" and user.get("verification_code") != verification.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": "", "code_expires": ""}},
    )
    return {"message": "Account verified successfully."}


# ── Resend verification ───────────────────────────────────────────────────────────

@router.post("/resend-verification", response_model=Dict[str, Any])
async def resend_verification(email: EmailStr, force_email: bool = False):
    """
    Resend verification email link or SMS code.
    Enforces a 60-second cooldown between resends.
    Set force_email=true to send email link even for SMS accounts (fallback).
    """
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already verified.")

    remaining = cooldown_remaining(user.get("code_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting another code.",
        )

    # force_email: SMS user wants email link fallback
    if force_email and user.get("verification_method") == "sms":
        from lib.tokens import create_email_token
        import os as _os
        token_str = create_email_token(user["email"], "verify")
        link = f"{FRONTEND_URL}/verify-email?token={token_str}"
        from utils.email_service import send_email_link
        ok = await send_email_link(user["email"], user["username"], link, "resend_verify")
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"code_sent_at": datetime.utcnow()}})
        return {
            "message": "A verification link has been sent to your email. Check your inbox and spam folder.",
            "code_sent": ok,
            "method": "email",
        }

    ok, method, new_code = await dispatch_resend_verification(user)

    update: dict = {"code_sent_at": datetime.utcnow()}
    if new_code:
        update["verification_code"] = new_code
        update["code_expires"] = datetime.utcnow() + timedelta(minutes=10)

    await db.users.update_one({"_id": user["_id"]}, {"$set": update})

    return {
        "message": (
            "A new verification link has been sent to your email."
            if method == "email"
            else "A new verification code has been sent via SMS."
        ),
        "code_sent": ok,
        "method": method,
    }


# ── Update phone (for SMS users who entered wrong number) ────────────────────────

@router.post("/update-phone", response_model=Dict[str, Any])
async def update_phone_before_verify(email: EmailStr, body: UpdatePhoneRequest):
    """
    Allow an unverified SMS user to correct their phone number,
    then trigger a fresh OTP to the new number.
    """
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already verified.")
    if user.get("verification_method") != "sms":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone update is only for SMS accounts.")

    # Check if new phone is already used by someone else
    conflict = await db.users.find_one({"phone_number": body.phone_number, "email": {"$ne": email}})
    if conflict:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already in use.")

    remaining = cooldown_remaining(user.get("code_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting a new code.",
        )

    from utils.sms_service import send_sms_otp
    new_code = generate_otp()
    ok = await send_sms_otp(body.phone_number, new_code)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "phone_number": body.phone_number,
            "verification_code": new_code,
            "code_expires": datetime.utcnow() + timedelta(minutes=10),
            "code_sent_at": datetime.utcnow(),
        }},
    )

    return {"message": f"Phone number updated and a new code has been sent to {body.phone_number}.", "code_sent": ok}


# ── Login ────────────────────────────────────────────────────────────────────────



# ── Verify via Link — JSON version (called by frontend page) ─────────────────

@router.post("/verify-email-link", response_model=Dict[str, Any])
async def verify_email_link_post(body: Dict[str, Any]):
    """
    Frontend calls this after the user clicks the verification link in their email.
    Accepts JSON {token}, verifies, and returns JSON success/error.
    No redirect — the frontend handles navigation.
    """
    token = body.get("token", "")
    try:
        payload = decode_email_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification link.")

    if payload.get("type") != "verify":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid link type.")

    email = payload.get("email")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.get("is_verified"):
        return {"success": True, "already_verified": True, "message": "Account already verified."}

    await db.users.update_one(
        {"email": email},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": "", "code_expires": ""}},
    )
    return {"success": True, "already_verified": False, "message": "Account verified successfully."}


# ── Confirm account deletion — JSON version (called by frontend page) ─────────

@router.post("/confirm-delete", response_model=Dict[str, Any])
async def confirm_delete_via_link_post(body: Dict[str, Any]):
    """
    Frontend calls this after the user clicks the deletion confirmation link.
    Accepts JSON {token}, deletes account, and returns JSON success/error.
    No redirect — the frontend handles navigation.
    """
    token = body.get("token", "")
    try:
        payload = decode_email_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deletion link has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid deletion link.")

    if payload.get("type") != "delete":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid link type.")

    email = payload.get("email")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    if user.get("role") == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin accounts cannot be deleted through this endpoint.")

    await _delete_user_data(user)
    return {"success": True, "message": "Account deleted successfully."}

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    """Login with username/email and password."""
    user = await db.users.find_one({
        "$or": [{"username": user_login.login}, {"email": user_login.login}]
    })

    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid login credentials.")

    if not user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please verify your account first.")

    if user.get("is_disabled"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled. Contact administrator.")

    token = create_access_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}


# ── Forgot password ──────────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=Dict[str, Any])
async def forgot_password(reset_request: PasswordReset):
    """
    Request a password reset.
    - Email users receive a reset LINK to their email.
    - SMS users receive a reset CODE to their phone.
    """
    user = await db.users.find_one({
        "$or": [{"email": reset_request.email_or_phone}, {"phone_number": reset_request.email_or_phone}]
    })
    if not user:
        # Don't reveal whether the user exists
        return {"message": "If that account exists, you will receive reset instructions shortly."}

    remaining = cooldown_remaining(user.get("reset_code_sent_at"))
    if remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} second(s) before requesting another reset.",
        )

    ok, method, code = await dispatch_password_reset(user)

    update: dict = {"reset_code_sent_at": datetime.utcnow()}
    if code:
        update["reset_code"] = code
        update["reset_code_expires"] = datetime.utcnow() + timedelta(minutes=10)

    await db.users.update_one({"_id": user["_id"]}, {"$set": update})

    return {
        "message": (
            "A password reset link has been sent to your email."
            if method == "email"
            else "A password reset code has been sent via SMS."
        ),
        "code_sent": ok,
        "method": method,
    }


# ── Reset password via link (email) ──────────────────────────────────────────────

@router.post("/reset-password-link", response_model=Dict[str, str])
async def reset_password_via_link(body: PasswordResetViaLinkConfirm):
    """Frontend calls this after the user clicks the email reset link and enters a new password."""
    try:
        payload = decode_email_token(body.token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset link.")

    if payload.get("type") != "reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type.")

    email = payload.get("email")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    hashed = hash_password(body.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed}, "$unset": {"reset_code": "", "reset_code_expires": ""}},
    )
    return {"message": "Password reset successfully."}


# ── Reset password via SMS code ───────────────────────────────────────────────────

@router.post("/reset-password-sms", response_model=Dict[str, str])
async def reset_password_via_sms(body: PasswordResetViaSmsConfirm):
    """Reset password using SMS OTP code."""
    user = await db.users.find_one({"phone_number": body.phone_number})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if datetime.utcnow() > user.get("reset_code_expires", datetime.min):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset code has expired.")

    if user.get("reset_code") != body.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset code.")

    hashed = hash_password(body.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed}, "$unset": {"reset_code": "", "reset_code_expires": ""}},
    )
    return {"message": "Password reset successfully."}


# ── Request account deletion ──────────────────────────────────────────────────────

@router.post("/request-account-deletion", response_model=Dict[str, Any])
async def request_account_deletion(current_user: dict = None):
    """
    Must be called with a valid Bearer token.
    Sends an email link or SMS code to confirm deletion.
    """
    from helpers.auth import get_current_user
    from fastapi import Request

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use the /user/request-delete endpoint instead.",
    )


# ── Confirm account deletion via link (email) ────────────────────────────────────

@router.get("/confirm-delete-link")
async def confirm_delete_via_link(token: str):
    """Called when the user clicks the deletion confirmation link."""
    try:
        payload = decode_email_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deletion link has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid deletion link.")

    if payload.get("type") != "delete":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid link type.")

    email = payload.get("email")
    user = await db.users.find_one({"email": email})
    if not user:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{FRONTEND_URL}/?deleted=not_found")

    # Super admins cannot be deleted via link — extra safety
    if user.get("role") == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin account cannot be deleted.")

    await _delete_user_data(user)

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}/?deleted=true")


# ── Confirm deletion via SMS code ─────────────────────────────────────────────────

@router.post("/confirm-account-deletion", response_model=Dict[str, str])
async def confirm_account_deletion(deletion: AccountDeletion):
    """Confirm account deletion using the SMS OTP code."""
    from helpers.auth import get_current_user
    # This endpoint is also available via user router with Bearer; kept here for parity
    user = await db.users.find_one({
        "$or": [{"email": deletion.email_or_phone}, {"phone_number": deletion.email_or_phone}]
    })
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.get("role") == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin account cannot be deleted.")

    if datetime.utcnow() > user.get("delete_code_expires", datetime.min):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code has expired.")

    if user.get("delete_code") != deletion.code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code.")

    await _delete_user_data(user)
    return {"message": "Account deleted successfully."}


async def _delete_user_data(user: dict):
    uid = user["id"]
    await db.users.delete_one({"id": uid})
    await db.notes.delete_many({"uploaded_by": uid})
    await db.past_papers.delete_many({"uploaded_by": uid})
    await db.reviews.delete_many({"reviewed_by": uid})
