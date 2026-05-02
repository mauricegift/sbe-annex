"""
Blog post routes — public listing, single view, reviews.
Admin create/update/delete are in routes/admin/blogs.py.

Filtering logic for public listing:
  - A logged-in user sees: ALL general posts (target_group=null)
    PLUS posts targeted at their own group.
  - Unauthenticated users see only general posts (target_group=null).
  - Optional ?group= and ?specialization= filters further narrow results.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from db.database import db
from helpers.auth import get_current_user
from helpers.utils import generate_short_id
from models.review import ReviewCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/blogs", tags=["blogs"])

_optional_bearer = HTTPBearer(auto_error=False)


async def _optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
) -> Optional[dict]:
    """Return the current user if a valid token is present, else None."""
    if not credentials:
        return None
    try:
        from lib.security import decode_token
        payload = decode_token(credentials.credentials)
        username = payload.get("sub")
        if not username:
            return None
        return await db.users.find_one({"username": username})
    except jwt.PyJWTError:
        return None


async def _enrich_blog(blog: dict) -> dict:
    """Attach review stats to a blog dict in-place."""
    reviews = await db.reviews.find(
        {"document_id": blog["id"], "document_type": "blog"}, {"_id": 0}
    ).to_list(None)
    blog["review_count"] = len(reviews)
    blog["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    return blog


@router.get("", response_model=Dict[str, Any])
async def get_blogs(
    group: Optional[str] = Query(None, description="Filter by group code (e.g. 'BBM')"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    search: Optional[str] = Query(None, min_length=2),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: Optional[dict] = Depends(_optional_user),
):
    """
    List blog posts.
    - General posts (target_group=null) are always included.
    - Group-specific posts are included when:
        * the user is logged in and belongs to that group, OR
        * the ?group= filter explicitly matches that group.
    - Admins/super admins see ALL posts regardless of group.
    - Optional ?specialization= further filters by target_specialization.
    """
    user_group = current_user.get("group") if current_user else None
    is_admin = current_user.get("is_admin", False) if current_user else False

    if is_admin:
        # Admins see everything; respect optional ?group= filter
        q: dict = {}
        if group:
            q["target_group"] = group.strip().upper()
    elif user_group:
        # Logged-in regular user: general posts + their group's posts
        q = {
            "$or": [
                {"target_group": None},
                {"target_group": user_group.upper()},
            ]
        }
        if group:
            # Further narrow to requested group (only if they belong to it)
            requested = group.strip().upper()
            if requested != user_group.upper():
                # They asked for another group's posts — only show general
                q = {"target_group": None}
            else:
                q = {"target_group": {"$in": [None, requested]}}
    else:
        # Unauthenticated — general posts only
        q = {"target_group": None}
        if group:
            q["target_group"] = group.strip().upper()

    # Apply specialization filter
    if specialization:
        spec_clause = {"$or": [{"target_specialization": None}, {"target_specialization": specialization.strip()}]}
        if "$or" in q and "$and" not in q:
            q = {"$and": [q, spec_clause]}
        elif "$and" in q:
            q["$and"].append(spec_clause)
        else:
            q.update({"$or": [{"target_specialization": None}, {"target_specialization": specialization.strip()}]})

    if search:
        search_clause = {
            "$or": [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
            ]
        }
        if "$or" in q:
            q = {"$and": [q, search_clause]}
        else:
            q.update(search_clause)

    skip = (page - 1) * limit
    total = await db.blogs.count_documents(q)
    blogs = await db.blogs.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)

    for blog in blogs:
        await _enrich_blog(blog)

    return {"data": blogs, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.get("/{blog_id}", response_model=Dict[str, Any])
async def get_blog(blog_id: str, current_user: Optional[dict] = Depends(_optional_user)):
    """
    Get a single blog post.
    If it is group-specific, only members of that group (and admins) can view it.
    """
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    # Enforce group visibility
    tg = blog.get("target_group")
    if tg:
        is_admin = current_user.get("is_admin", False) if current_user else False
        user_group = current_user.get("group") if current_user else None
        if not is_admin and (not user_group or user_group.upper() != tg.upper()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This post is for {tg} group members only.",
            )

    reviews = await db.reviews.find(
        {"document_id": blog_id, "document_type": "blog"}, {"_id": 0}
    ).sort("created_at", -1).to_list(None)

    for r in reviews:
        reviewer = await db.users.find_one(
            {"id": r["reviewed_by"]}, {"_id": 0, "username": 1, "name": 1, "profile_picture": 1}
        )
        if reviewer:
            r.update({
                "reviewed_by_username": reviewer.get("username"),
                "reviewed_by_name": reviewer.get("name"),
                "reviewed_by_profile_picture": reviewer.get("profile_picture"),
            })

    blog["reviews"] = reviews
    blog["review_count"] = len(reviews)
    blog["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    await db.blogs.update_one({"id": blog_id}, {"$inc": {"views": 1}})
    blog["views"] = blog.get("views", 0) + 1
    return blog


@router.post("/{blog_id}/review", response_model=Dict[str, Any])
async def add_blog_review(
    blog_id: str,
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    blog = await db.blogs.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    # Group visibility check for reviews too
    tg = blog.get("target_group")
    if tg and not current_user.get("is_admin", False):
        user_group = current_user.get("group")
        if not user_group or user_group.upper() != tg.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This post is for {tg} group members only.",
            )

    existing = await db.reviews.find_one({
        "document_id": blog_id,
        "document_type": "blog",
        "reviewed_by": current_user["id"],
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this blog post.")

    review_data = {
        "id": generate_short_id(),
        "document_id": blog_id,
        "document_type": "blog",
        "content": review.content,
        "rating": review.rating,
        "reviewed_by": current_user["id"],
        "reviewed_by_name": current_user["name"],
        "reviewed_by_profile_picture": current_user.get("profile_picture"),
        "created_at": datetime.utcnow(),
    }
    await db.reviews.insert_one(review_data)
    return {"message": "Review added successfully.", "review_id": review_data["id"]}
