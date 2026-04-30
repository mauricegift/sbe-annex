"""
Review models (for notes, past papers, blogs).
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    rating: int = Field(..., ge=1, le=5)


class ReviewOut(ReviewCreate):
    id: str
    reviewed_by: str
    reviewed_by_name: str
    reviewed_by_profile_picture: Optional[str]
    created_at: datetime
