"""
Past papers upload, listing, viewing, reviewing and deletion routes.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from db.database import db
from helpers.auth import get_current_user
from models.document import DocumentUpload, Status
from models.review import ReviewCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/past-papers", tags=["past_papers"])


@router.post("/upload", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def upload_past_paper(paper: DocumentUpload, current_user: dict = Depends(get_current_user)):
    paper_data = {
        "id": str(uuid.uuid4()),
        "course_title": paper.course_title,
        "course_code": paper.course_code,
        "year_of_study": paper.year_of_study,
        "semester_of_study": paper.semester_of_study,
        "group": paper.group,
        "specialization": ([paper.specialization] if isinstance(paper.specialization, str) else paper.specialization) if paper.specialization else None,
        "file_url": paper.file_url,
        "thumbnail_url": paper.thumbnail_url,
        "description": paper.description,
        "uploaded_by": current_user["id"],
        "uploaded_by_name": current_user["name"],
        "uploaded_by_profile_picture": current_user.get("profile_picture"),
        "status": Status.PENDING,
        "views": 0,
        "viewers": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.past_papers.insert_one(paper_data)
    return {"message": "Past paper uploaded successfully. Awaiting admin approval.", "paper_id": paper_data["id"]}


@router.get("", response_model=Dict[str, Any])
async def get_past_papers(
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
    total = await db.past_papers.count_documents(q)
    papers = await db.past_papers.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)

    for paper in papers:
        reviews = await db.reviews.find(
            {"document_id": paper["id"], "document_type": "past_paper"}, {"_id": 0}
        ).sort("created_at", -1).to_list(None)
        for r in reviews:
            reviewer = await db.users.find_one({"id": r["reviewed_by"]}, {"_id": 0, "username": 1, "name": 1, "profile_picture": 1})
            if reviewer:
                r.update({"reviewed_by_username": reviewer.get("username"), "reviewed_by_name": reviewer.get("name"), "reviewed_by_profile_picture": reviewer.get("profile_picture")})
        paper["reviews"] = reviews
        paper["review_count"] = len(reviews)
        paper["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    return {"data": papers, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.get("/my-uploads", response_model=Dict[str, Any])
async def get_my_papers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    skip = (page - 1) * limit
    total = await db.past_papers.count_documents({"uploaded_by": current_user["id"]})
    papers = await db.past_papers.find({"uploaded_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(None)
    for paper in papers:
        reviews = await db.reviews.find({"document_id": paper["id"], "document_type": "past_paper"}, {"_id": 0}).to_list(None)
        paper["review_count"] = len(reviews)
    return {"data": papers, "total": total, "page": page, "limit": limit, "has_next": (page * limit) < total}


@router.get("/{paper_id}", response_model=Dict[str, Any])
async def get_past_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await db.past_papers.find_one({"id": paper_id, "status": Status.APPROVED}, {"_id": 0})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found or not approved.")

    reviews = await db.reviews.find(
        {"document_id": paper_id, "document_type": "past_paper"}, {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    for r in reviews:
        reviewer = await db.users.find_one({"id": r["reviewed_by"]}, {"_id": 0, "username": 1, "name": 1, "profile_picture": 1})
        if reviewer:
            r.update({"reviewed_by_username": reviewer.get("username"), "reviewed_by_name": reviewer.get("name"), "reviewed_by_profile_picture": reviewer.get("profile_picture")})

    paper["reviews"] = reviews
    paper["review_count"] = len(reviews)
    paper["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    if current_user["username"] not in paper.get("viewers", []):
        await db.past_papers.update_one({"id": paper_id}, {"$inc": {"views": 1}, "$push": {"viewers": current_user["username"]}})
        paper["views"] = paper.get("views", 0) + 1

    return paper


@router.get("/view/{paper_id}")
async def view_paper_file(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await db.past_papers.find_one({"id": paper_id, "status": Status.APPROVED})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found.")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(paper["file_url"]) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")
                content = await resp.read()
                if current_user["username"] not in paper.get("viewers", []):
                    await db.past_papers.update_one({"id": paper_id}, {"$inc": {"views": 1}, "$push": {"viewers": current_user["username"]}})
                return Response(content=content, media_type=resp.headers.get("Content-Type", "application/octet-stream"))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error fetching past paper file: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching file.")


@router.post("/{paper_id}/review", response_model=Dict[str, Any])
async def add_paper_review(paper_id: str, review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    paper = await db.past_papers.find_one({"id": paper_id, "status": Status.APPROVED})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found.")

    existing = await db.reviews.find_one({"document_id": paper_id, "document_type": "past_paper", "reviewed_by": current_user["id"]})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this past paper.")

    review_data = {
        "id": str(uuid.uuid4()),
        "document_id": paper_id,
        "document_type": "past_paper",
        "content": review.content,
        "rating": review.rating,
        "reviewed_by": current_user["id"],
        "reviewed_by_name": current_user["name"],
        "reviewed_by_profile_picture": current_user.get("profile_picture"),
        "created_at": datetime.utcnow(),
    }
    await db.reviews.insert_one(review_data)
    return {"message": "Review added successfully.", "review_id": review_data["id"]}


@router.delete("/{paper_id}", response_model=Dict[str, str])
async def delete_past_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await db.past_papers.find_one({"id": paper_id})
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Past paper not found.")

    is_owner = paper["uploaded_by"] == current_user["id"]
    is_admin = current_user.get("is_admin", False)

    if not is_owner and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised.")

    if is_owner and not is_admin and paper["status"] not in [Status.PENDING, Status.REJECTED]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete approved past papers.")

    await db.past_papers.delete_one({"id": paper_id})
    await db.reviews.delete_many({"document_id": paper_id, "document_type": "past_paper"})
    return {"message": "Past paper deleted successfully."}
