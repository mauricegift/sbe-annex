"""
Admin user management routes.
Super admin is immune — cannot be modified, disabled, or deleted by anyone.
"""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from db.database import db
from helpers.auth import get_admin_user, get_super_admin_user
from models.user import AdminUserUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("", response_model=Dict[str, Any])
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    admin_user: dict = Depends(get_admin_user),
):
    """List all users (admin only)."""
    q: dict = {}
    if search:
        q["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    total = await db.users.count_documents(q)
    users = await db.users.find(q, {"_id": 0, "password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    return {"data": users, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.put("/{user_id}", response_model=Dict[str, str])
async def update_user(
    user_id: str,
    update: AdminUserUpdate,
    admin_user: dict = Depends(get_admin_user),
):
    """
    Update a user's admin or disabled status.
    - Super admin cannot be touched by anyone.
    - Only super admin can promote/demote other admins.
    """
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target.get("role") == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin account cannot be modified.",
        )

    # Only super admin can change is_admin
    if update.is_admin is not None and admin_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the super admin can promote or demote admin roles.",
        )

    update_data: dict = {}
    if update.is_admin is not None:
        update_data["is_admin"] = update.is_admin
        update_data["role"] = "admin" if update.is_admin else "user"
    if update.is_disabled is not None:
        update_data["is_disabled"] = update.is_disabled

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided.")

    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "User updated successfully."}


@router.delete("/{user_id}", response_model=Dict[str, str])
async def delete_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
):
    """
    Delete a user and all their data (admin only).
    Super admin account cannot be deleted.
    """
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target.get("role") == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin account cannot be deleted.")

    await db.users.delete_one({"id": user_id})
    await db.notes.delete_many({"uploaded_by": user_id})
    await db.past_papers.delete_many({"uploaded_by": user_id})
    await db.reviews.delete_many({"reviewed_by": user_id})
    return {"message": "User deleted successfully."}
