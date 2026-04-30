"""
Public groups route — returns all groups and their specializations.
Used by frontend to populate sign-up and upload form dropdowns.
"""
from typing import Any, Dict, List
from fastapi import APIRouter
from db.database import db

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_groups():
    """List all active groups with their specializations (public endpoint)."""
    groups = await db.groups.find({}, {"_id": 0}).sort("name", 1).to_list(None)
    return groups
