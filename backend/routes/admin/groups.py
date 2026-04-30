"""
Admin group & specialization management.
Groups define the top-level academic programmes (BBM, BCM, BMM, SM …).
Each group holds a list of specialization names (BIT, MARKETING, ACCOUNTING …).
These values power signup and upload forms site-wide — changes take effect everywhere immediately.
"""
import uuid
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from db.database import db
from helpers.auth import get_admin_user
from models.group import GroupCreate, GroupUpdate, SpecializationAdd

router = APIRouter(prefix="/admin/groups", tags=["admin", "groups"])


# ── List all groups (admin view with more detail) ────────────────────────────────

@router.get("", response_model=List[Dict[str, Any]])
async def list_groups(admin_user: dict = Depends(get_admin_user)):
    return await db.groups.find({}, {"_id": 0}).sort("name", 1).to_list(None)


# ── Create a group ───────────────────────────────────────────────────────────────

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_group(body: GroupCreate, admin_user: dict = Depends(get_admin_user)):
    """Create a new academic group (e.g. BBM, BCM)."""
    existing = await db.groups.find_one({"code": body.code.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A group with code '{body.code.upper()}' already exists.",
        )

    # Normalise specialization names to uppercase
    specs = [s.strip().upper() for s in body.specializations if s.strip()]

    group_data = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "code": body.code.upper(),
        "description": body.description,
        "specializations": list(dict.fromkeys(specs)),  # deduplicate, preserve order
        "created_at": datetime.utcnow(),
        "created_by": admin_user["id"],
    }
    await db.groups.insert_one(group_data)
    group_data.pop("_id", None)
    return {"message": "Group created successfully.", "group": group_data}


# ── Update group metadata ────────────────────────────────────────────────────────

@router.put("/{group_id}", response_model=Dict[str, str])
async def update_group(group_id: str, body: GroupUpdate, admin_user: dict = Depends(get_admin_user)):
    """Update group name or description."""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    update_data = body.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided.")

    await db.groups.update_one({"id": group_id}, {"$set": update_data})
    return {"message": "Group updated successfully."}


# ── Delete a group ───────────────────────────────────────────────────────────────

@router.delete("/{group_id}", response_model=Dict[str, str])
async def delete_group(group_id: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a group. Users/documents with this group keep their data but group won't appear in new forms."""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    await db.groups.delete_one({"id": group_id})
    return {"message": f"Group '{group['name']}' deleted. Existing users and documents are unaffected."}


# ── Add a specialization to a group ─────────────────────────────────────────────

@router.post("/{group_id}/specializations", response_model=Dict[str, Any])
async def add_specialization(
    group_id: str,
    body: SpecializationAdd,
    admin_user: dict = Depends(get_admin_user),
):
    """Add a new specialization to an existing group."""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    spec_name = body.name.strip().upper()

    if spec_name in group.get("specializations", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Specialization '{spec_name}' already exists in this group.",
        )

    await db.groups.update_one({"id": group_id}, {"$push": {"specializations": spec_name}})
    return {"message": f"Specialization '{spec_name}' added to group '{group['name']}'.", "specialization": spec_name}


# ── Remove a specialization from a group ────────────────────────────────────────

@router.delete("/{group_id}/specializations/{spec_name}", response_model=Dict[str, str])
async def remove_specialization(
    group_id: str,
    spec_name: str,
    admin_user: dict = Depends(get_admin_user),
):
    """Remove a specialization from a group."""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    name_upper = spec_name.strip().upper()
    if name_upper not in group.get("specializations", []):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Specialization '{name_upper}' not found in this group.",
        )

    await db.groups.update_one({"id": group_id}, {"$pull": {"specializations": name_upper}})
    return {"message": f"Specialization '{name_upper}' removed from group '{group['name']}'."}
