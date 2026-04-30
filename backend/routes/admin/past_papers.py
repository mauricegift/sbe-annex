"""
Admin past papers management — approve/reject, edit, view pending.
"""
from typing import Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from db.database import db
from helpers.auth import get_admin_user
from models.document import DocumentUpdate, DocumentStatusUpdate, Status
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/past-papers/pending", response_model=Dict[str, Any])
async def get_pending_papers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user),
):
    skip = (page - 1) * limit
    total = await db.past_papers.count_documents({"status": Status.PENDING})
    papers = await db.past_papers.find({"status": Status.PENDING}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    return {"data": papers, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.put("/past-papers/{paper_id}", response_model=Dict[str, str])
async def update_paper_status(
    paper_id: str,
    update: DocumentStatusUpdate,
    admin_user: dict = Depends(get_admin_user),
):
    paper = await db.past_papers.find_one({"id": paper_id})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found.")

    await db.past_papers.update_one(
        {"id": paper_id},
        {"$set": {"status": update.status, "feedback": update.feedback, "updated_at": datetime.utcnow()}},
    )

    # Notify uploader if they have notifications enabled
    if update.status in (Status.APPROVED, Status.REJECTED):
        uploader = await db.users.find_one({"id": paper.get("uploaded_by")})
        if uploader and uploader.get("notify_on_upload_decision", True):
            try:
                from utils.email_service import send_upload_notification
                decision = "approved" if update.status == Status.APPROVED else "rejected"
                await send_upload_notification(
                    email=uploader["email"],
                    username=uploader["username"],
                    doc_type="past paper",
                    title=paper.get("course_title", paper.get("title", "your past paper")),
                    decision=decision,
                    feedback=update.feedback or "",
                )
            except Exception as exc:
                logger.warning(f"Upload notification failed for paper {paper_id}: {exc}")

    return {"message": f"Past paper {update.status} successfully."}


@router.put("/past-papers/{paper_id}/edit", response_model=Dict[str, str])
async def admin_edit_past_paper(
    paper_id: str,
    paper_update: DocumentUpdate,
    admin_user: dict = Depends(get_admin_user),
):
    paper = await db.past_papers.find_one({"id": paper_id})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found.")

    update_data = paper_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    await db.past_papers.update_one({"id": paper_id}, {"$set": update_data})
    return {"message": "Past paper updated successfully."}
