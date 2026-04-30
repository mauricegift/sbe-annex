"""
Blog post models.
target_group: None/null means the post is for ALL groups.
              A group code string (e.g. "BBM") means it targets that group
              (all of its specializations) specifically.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional


class BlogPost(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=10)
    thumbnail_url: Optional[str] = None
    target_group: Optional[str] = Field(
        None,
        description=(
            "Group code to target (e.g. 'BBM'). "
            "Leave null/empty to publish to ALL groups."
        ),
    )

    @validator("thumbnail_url")
    def validate_thumbnail_url(cls, v):
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("Thumbnail URL must start with http:// or https://")
        return v

    @validator("target_group", pre=True)
    def normalise_group(cls, v):
        if v:
            return v.strip().upper() or None
        return None
