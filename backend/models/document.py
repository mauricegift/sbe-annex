"""
Models for notes and past paper documents.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from enum import Enum


class Status(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DocumentUpload(BaseModel):
    course_title: str = Field(..., min_length=2, max_length=100)
    course_code: str = Field(..., min_length=2, max_length=20, pattern="^[A-Z0-9]+$")
    year_of_study: int = Field(..., ge=1, le=4)
    semester_of_study: int = Field(..., ge=1, le=2)
    group: Optional[str] = None
    specialization: Optional[str] = None
    file_url: str = Field(..., min_length=10)
    thumbnail_url: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)

    @validator("file_url", "thumbnail_url")
    def validate_urls(cls, v):
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @validator("specialization", pre=True, always=True)
    def validate_specialization(cls, v, values):
        if "year_of_study" in values and values["year_of_study"] >= 3 and not v:
            raise ValueError("Specialization is required for year 3 and above")
        return v


class DocumentUpdate(BaseModel):
    course_title: Optional[str] = Field(None, min_length=2, max_length=100)
    course_code: Optional[str] = Field(None, min_length=2, max_length=20, pattern="^[A-Z0-9]+$")
    year_of_study: Optional[int] = Field(None, ge=1, le=4)
    semester_of_study: Optional[int] = Field(None, ge=1, le=2)
    group: Optional[str] = None
    specialization: Optional[str] = None
    file_url: Optional[str] = Field(None, min_length=10)
    thumbnail_url: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[Status] = None

    @validator("file_url", "thumbnail_url")
    def validate_urls(cls, v):
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class DocumentStatusUpdate(BaseModel):
    status: Status
    feedback: Optional[str] = None
