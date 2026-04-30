"""
Models for dynamic groups and specializations (admin-managed).
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20, pattern="^[A-Z0-9]+$")
    description: Optional[str] = Field(None, max_length=500)
    specializations: List[str] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class SpecializationAdd(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupOut(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str]
    specializations: List[str]
    created_at: datetime
