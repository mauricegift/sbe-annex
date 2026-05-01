"""
User-related Pydantic models.
"""
from pydantic import BaseModel, Field, EmailStr, validator, model_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class VerificationMethod(str, Enum):
    EMAIL = "email"
    SMS = "sms"


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    year_of_study: int = Field(..., ge=1, le=4)
    semester_of_study: int = Field(..., ge=1, le=2)
    # group and specialization are now dynamic strings (validated against DB at route level)
    group: Optional[str] = None
    specialization: Optional[str] = None
    verification_method: VerificationMethod
    phone_number: Optional[str] = Field(None, pattern=r"^(07|01)[0-9]{8}$")



    @model_validator(mode="after")
    def validate_phone_for_sms(cls, values):
        if values.verification_method == VerificationMethod.SMS and not values.phone_number:
            raise ValueError("Phone number is required when using SMS verification")
        return values


class UserLogin(BaseModel):
    login: str  # username or email
    password: str


class UserProfile(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    year_of_study: int = Field(..., ge=1, le=4)
    semester_of_study: int = Field(..., ge=1, le=2)
    group: Optional[str] = None
    specialization: Optional[str] = None
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = Field(None, pattern=r"^(07|01)[0-9]{8}$")

    @validator("profile_picture")
    def validate_profile_picture(cls, v):
        if v and not v.startswith(("http://", "https://", "data:image/")):
            raise ValueError("Profile picture must be a valid URL or data URI")
        return v




class UpdatePhoneRequest(BaseModel):
    """Allow user to change their phone number before resending SMS code."""
    phone_number: str = Field(..., pattern=r"^(07|01)[0-9]{8}$")


class PasswordReset(BaseModel):
    email_or_phone: str


class PasswordResetViaSmsConfirm(BaseModel):
    phone_number: str
    code: str
    new_password: str = Field(..., min_length=8)


class PasswordResetViaLinkConfirm(BaseModel):
    """For email-based resets — token comes from the link, not a code."""
    token: str
    new_password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class EmailVerification(BaseModel):
    """Used for SMS code verification."""
    identifier: str  # phone or email
    code: str


class AccountDeletion(BaseModel):
    email_or_phone: str
    code: str
    verification_method: VerificationMethod


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    name: str
    year_of_study: int
    semester_of_study: int
    group: Optional[str]
    specialization: Optional[str]
    profile_picture: Optional[str]
    phone_number: Optional[str]
    is_verified: bool
    is_admin: bool
    role: str
    is_disabled: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class AdminUserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_disabled: Optional[bool] = None
