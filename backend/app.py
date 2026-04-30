"""
Sbe Annex Backend — Main Application Entry Point
=================================================
All heavy logic lives in the submodules:
  db/         — database connection
  models/     — Pydantic models
  lib/        — security (JWT, password hashing) and token utilities
  helpers/    — FastAPI auth dependencies, general utils
  utils/      — email and SMS service adapters
  functions/  — verification flow logic (cooldowns, dispatch)
  routes/     — endpoint handlers organised by domain
"""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Load .env ─────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Sbe Annex Learning Platform",
    version="3.0.0",
    description=(
        "Academic resources platform for Sbe Annex — notes, past papers, "
        "blogs, and group/specialization management."
    ),
)

# ── Pretty-print JSON (2-space indent) ────────────────────────────────────────
class PrettyJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        import json
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            separators=(", ", ": "),
            default=str,
        ).encode("utf-8")

app.default_response_class = PrettyJSONResponse

# ── CORS ──────────────────────────────────────────────────────────────────────
# Set CORS_ORIGINS in .env as comma-separated list of allowed origins.
# Example: CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
# For local development add http://localhost:5173 or your Vite dev port.
# The backend trusts whatever is listed here — keep it tight in production.
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["Content-Length", "Content-Disposition", "X-Request-ID"],
    max_age=600,
)

# ── Database lifecycle ────────────────────────────────────────────────────────
from db.database import client, db  # noqa: E402


@app.on_event("startup")
async def startup_db_client():
    await client.admin.command("ping")
    logger.info("Connected to MongoDB (%s)", os.getenv("DB_NAME", "sbe_annex"))

    # ── Indexes ────────────────────────────────────────────────────────────────
    await db.users.create_index([("username", 1)], unique=True)
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("phone_number", 1)])
    await db.users.create_index([("role", 1)])
    await db.notes.create_index([("status", 1)])
    await db.notes.create_index([("uploaded_by", 1)])
    await db.notes.create_index([("group", 1), ("specialization", 1)])
    await db.past_papers.create_index([("status", 1)])
    await db.past_papers.create_index([("uploaded_by", 1)])
    await db.past_papers.create_index([("group", 1), ("specialization", 1)])
    await db.reviews.create_index([("document_id", 1), ("document_type", 1)])
    await db.reviews.create_index([("reviewed_by", 1)])
    await db.blogs.create_index([("author", 1)])
    await db.groups.create_index([("code", 1)], unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("MongoDB connection closed.")


# ── Routes ────────────────────────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.user import router as user_router
from routes.dashboard import router as dashboard_router
from routes.notes import router as notes_router
from routes.past_papers import router as papers_router
from routes.blogs import router as blogs_router
from routes.groups import router as groups_router
from routes.admin.users import router as admin_users_router
from routes.admin.notes import router as admin_notes_router
from routes.admin.past_papers import router as admin_papers_router
from routes.admin.blogs import router as admin_blogs_router
from routes.admin.groups import router as admin_groups_router

API_PREFIX = "/api"

for router in [
    auth_router,
    user_router,
    dashboard_router,
    notes_router,
    papers_router,
    blogs_router,
    groups_router,
    admin_users_router,
    admin_notes_router,
    admin_papers_router,
    admin_blogs_router,
    admin_groups_router,
]:
    app.include_router(router, prefix=API_PREFIX)


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Sbe Annex Learning Platform API v3.0", "status": "running"}


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3192"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
