"""
Admin notes management — approve/reject, edit, view pending.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from db.database import db
from helpers.auth import get_admin_user
from models.document import DocumentUpdate, DocumentStatusUpdate, Status
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/notes/pending", response_model=Dict[str, Any])
async def get_pending_notes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user),
):
    skip = (page - 1) * limit
    total = await db.notes.count_documents({"status": Status.PENDING})
    notes = await db.notes.find({"status": Status.PENDING}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    return {"data": notes, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.put("/notes/{note_id}", response_model=Dict[str, str])
async def update_note_status(
    note_id: str,
    update: DocumentStatusUpdate,
    admin_user: dict = Depends(get_admin_user),
):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    await db.notes.update_one(
        {"id": note_id},
        {"$set": {"status": update.status, "feedback": update.feedback, "updated_at": datetime.utcnow()}},
    )
    return {"message": f"Note {update.status} successfully."}


@router.put("/notes/{note_id}/edit", response_model=Dict[str, str])
async def admin_edit_note(
    note_id: str,
    note_update: DocumentUpdate,
    admin_user: dict = Depends(get_admin_user),
):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    update_data = note_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    if update_data.get("year_of_study", 0) >= 3 and not update_data.get("specialization"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Specialization is required for year 3 and above.")

    await db.notes.update_one({"id": note_id}, {"$set": update_data})
    return {"message": "Note updated successfully."}
