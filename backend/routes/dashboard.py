"""
Dashboard stats route.
"""
from typing import Any, Dict
from fastapi import APIRouter, Depends
from db.database import db
from helpers.auth import get_current_user
from helpers.utils import get_greeting
from models.document import Status

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=Dict[str, Any])
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Return personalised dashboard stats and greeting."""
    greeting = get_greeting()

    notes_count = await db.notes.count_documents({"status": Status.APPROVED})
    papers_count = await db.past_papers.count_documents({"status": Status.APPROVED})
    user_notes = await db.notes.count_documents({"uploaded_by": current_user["id"], "status": {"$ne": Status.REJECTED}})
    user_papers = await db.past_papers.count_documents({"uploaded_by": current_user["id"], "status": {"$ne": Status.REJECTED}})

    return {
        "greeting": f"{greeting}, {current_user['name']}",
        "stats": {
            "available_notes": notes_count,
            "available_papers": papers_count,
            "my_uploads": user_notes + user_papers,
            "my_notes": user_notes,
            "my_papers": user_papers,
        },
    }
