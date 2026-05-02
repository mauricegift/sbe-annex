"""
Notes upload, listing, viewing, reviewing and deletion routes.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from db.database import db
from helpers.auth import get_current_user
from helpers.utils import generate_short_id
from models.document import DocumentUpload, Status
from models.review import ReviewCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/upload", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def upload_note(note: DocumentUpload, current_user: dict = Depends(get_current_user)):
    note_data = {
        "id": generate_short_id(),
        "course_title": note.course_title,
        "course_code": note.course_code,
        "year_of_study": note.year_of_study,
        "semester_of_study": note.semester_of_study,
        "group": note.group,
        "specialization": ([note.specialization] if isinstance(note.specialization, str) else note.specialization) if note.specialization else None,
        "file_url": note.file_url,
        "thumbnail_url": note.thumbnail_url,
        "description": note.description,
        "uploaded_by": current_user["id"],
        "uploaded_by_name": current_user["name"],
        "uploaded_by_profile_picture": current_user.get("profile_picture"),
        "status": Status.PENDING,
        "views": 0,
        "viewers": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.notes.insert_one(note_data)
    return {"message": "Note uploaded successfully. Awaiting admin approval.", "note_id": note_data["id"]}


@router.get("", response_model=Dict[str, Any])
async def get_notes(
    year: Optional[int] = Query(None, ge=1, le=4),
    semester: Optional[int] = Query(None, ge=1, le=2),
    group: Optional[str] = Query(None),
    specialization: Optional[str] = Query(None),
    search: Optional[str] = Query(None, min_length=2),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    q: dict = {"status": Status.APPROVED}
    if year:
        q["year_of_study"] = year
    if semester:
        q["semester_of_study"] = semester
    if group:
        q["group"] = group.upper()
    if specialization:
        q["$or"] = [{"specialization": {"$in": [specialization, "COMMON"]}}, {"specialization": specialization}, {"specialization": "COMMON"}]
    if search:
        q["$or"] = [
            {"course_title": {"$regex": search, "$options": "i"}},
            {"course_code": {"$regex": search, "$options": "i"}},
            {"uploaded_by_name": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    total = await db.notes.count_documents(q)
    notes = await db.notes.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)

    for note in notes:
        reviews = await db.reviews.find(
            {"document_id": note["id"], "document_type": "note"}, {"_id": 0}
        ).to_list(None)
        note["review_count"] = len(reviews)
        note["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    return {"data": notes, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.get("/my-uploads", response_model=Dict[str, Any])
async def get_my_uploads(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    skip = (page - 1) * limit
    total = await db.notes.count_documents({"uploaded_by": current_user["id"]})
    notes = await db.notes.find(
        {"uploaded_by": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(None)

    for note in notes:
        reviews = await db.reviews.find({"document_id": note["id"], "document_type": "note"}, {"_id": 0}).to_list(None)
        note["review_count"] = len(reviews)

    return {"data": notes, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.get("/{note_id}", response_model=Dict[str, Any])
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id, "status": Status.APPROVED}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found or not approved.")

    reviews = await db.reviews.find(
        {"document_id": note_id, "document_type": "note"}, {"_id": 0}
    ).sort("created_at", -1).to_list(None)

    for review in reviews:
        reviewer = await db.users.find_one({"id": review["reviewed_by"]}, {"_id": 0, "username": 1, "name": 1, "profile_picture": 1})
        if reviewer:
            review.update({
                "reviewed_by_username": reviewer.get("username"),
                "reviewed_by_name": reviewer.get("name"),
                "reviewed_by_profile_picture": reviewer.get("profile_picture"),
            })

    note["reviews"] = reviews
    note["review_count"] = len(reviews)
    note["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    if current_user["username"] not in note.get("viewers", []):
        await db.notes.update_one({"id": note_id}, {"$inc": {"views": 1}, "$push": {"viewers": current_user["username"]}})
        note["views"] = note.get("views", 0) + 1

    return note


@router.get("/view/{note_id}")
async def view_note_file(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id, "status": Status.APPROVED})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(note["file_url"]) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")
                content_type = resp.headers.get("Content-Type", "application/octet-stream")
                content = await resp.read()
                if current_user["username"] not in note.get("viewers", []):
                    await db.notes.update_one({"id": note_id}, {"$inc": {"views": 1}, "$push": {"viewers": current_user["username"]}})
                return Response(content=content, media_type=content_type)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error fetching note file: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching file.")


@router.post("/{note_id}/review", response_model=Dict[str, Any])
async def add_note_review(note_id: str, review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id, "status": Status.APPROVED})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    existing = await db.reviews.find_one({"document_id": note_id, "document_type": "note", "reviewed_by": current_user["id"]})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this note.")

    review_data = {
        "id": str(uuid.uuid4()),
        "document_id": note_id,
        "document_type": "note",
        "content": review.content,
        "rating": review.rating,
        "reviewed_by": current_user["id"],
        "reviewed_by_name": current_user["name"],
        "reviewed_by_profile_picture": current_user.get("profile_picture"),
        "created_at": datetime.utcnow(),
    }
    await db.reviews.insert_one(review_data)
    return {"message": "Review added successfully.", "review_id": review_data["id"]}


@router.delete("/{note_id}", response_model=Dict[str, str])
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    is_owner = note["uploaded_by"] == current_user["id"]
    is_admin = current_user.get("is_admin", False)

    if not is_owner and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised.")

    if is_owner and not is_admin and note["status"] not in [Status.PENDING, Status.REJECTED]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete approved notes.")

    await db.notes.delete_one({"id": note_id})
    await db.reviews.delete_many({"document_id": note_id, "document_type": "note"})
    return {"message": "Note deleted successfully."}
