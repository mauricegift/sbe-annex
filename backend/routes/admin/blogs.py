"""
Admin blog management — create, update, delete blog posts.

target_group semantics:
  null / not provided  →  post is visible to ALL groups ("General / All Groups")
  "BBM"               →  post is visible only to BBM group members + all admins
"""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from db.database import db
from helpers.auth import get_admin_user
from models.blog import BlogPost

router = APIRouter(prefix="/admin/blogs", tags=["blogs"])


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_blog(blog: BlogPost, admin_user: dict = Depends(get_admin_user)):
    """
    Create a new blog post.
    - Set target_group to a group code (e.g. "BBM") to target that group only.
    - Leave target_group null to publish to all groups.
    """
    # Validate the target group exists in DB if specified
    if blog.target_group:
        group_doc = await db.groups.find_one({"code": blog.target_group})
        if not group_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{blog.target_group}' does not exist. Create it first via admin/groups.",
            )

    blog_data = {
        "id": str(uuid.uuid4()),
        "title": blog.title,
        "content": blog.content,
        "thumbnail_url": blog.thumbnail_url,
        "target_group": blog.target_group,  # None = all groups
        "author": admin_user["id"],
        "author_name": admin_user["name"],
        "author_profile_picture": admin_user.get("profile_picture"),
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.blogs.insert_one(blog_data)
    blog_data.pop("_id", None)
    return {
        "message": "Blog post created successfully.",
        "blog_id": blog_data["id"],
        "audience": blog.target_group if blog.target_group else "All Groups",
    }


@router.get("", response_model=Dict[str, Any])
async def list_all_blogs_admin(
    group: Optional[str] = Query(None, description="Filter by target_group code"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user),
):
    """Admin view of all blogs, optionally filtered by group."""
    q: dict = {}
    if group:
        q["target_group"] = group.strip().upper()

    skip = (page - 1) * limit
    total = await db.blogs.count_documents(q)
    blogs = await db.blogs.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)

    for blog in blogs:
        reviews = await db.reviews.find(
            {"document_id": blog["id"], "document_type": "blog"}, {"_id": 0}
        ).to_list(None)
        blog["review_count"] = len(reviews)
        blog["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    return {"data": blogs, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.put("/{blog_id}", response_model=Dict[str, str])
async def update_blog(blog_id: str, blog: BlogPost, admin_user: dict = Depends(get_admin_user)):
    """Update a blog post including its target group."""
    existing = await db.blogs.find_one({"id": blog_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    if blog.target_group:
        group_doc = await db.groups.find_one({"code": blog.target_group})
        if not group_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group '{blog.target_group}' does not exist.",
            )

    blog_data = blog.dict(exclude_unset=True)
    blog_data["updated_at"] = datetime.utcnow()
    await db.blogs.update_one({"id": blog_id}, {"$set": blog_data})
    return {"message": "Blog post updated successfully."}


@router.delete("/{blog_id}", response_model=Dict[str, str])
async def delete_blog(blog_id: str, admin_user: dict = Depends(get_admin_user)):
    blog = await db.blogs.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")
    await db.blogs.delete_one({"id": blog_id})
    await db.reviews.delete_many({"document_id": blog_id, "document_type": "blog"})
    return {"message": "Blog post deleted successfully."}
