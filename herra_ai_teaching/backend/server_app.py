from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.api.chat import router as chat_router
from backend.api.connectors import router as connectors_router
from backend.api.contracts import (
    ApiError,
    api_error_handler,
    get_request_id,
    http_exception_handler,
    unhandled_exception_handler,
)
from backend.api.ingest import router as ingest_router
from backend.api.jobs import router as jobs_router
from backend.api.system import router as system_router
from backend.storage.database import init_db

APP_TITLE = "Herra AI Teaching Server"
APP_VERSION = "1.0.0"

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend" / "dist"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"

DEFAULT_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8001",
    "http://localhost:8001",
]


app = FastAPI(title=APP_TITLE, version=APP_VERSION)


@app.on_event("startup")
def startup_init_db() -> None:
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)

app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(FastAPIHTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = get_request_id(request)
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


app.include_router(system_router)
app.include_router(ingest_router)
app.include_router(connectors_router)
app.include_router(jobs_router)
app.include_router(chat_router)


@app.get("/server/health")
def server_health() -> dict[str, object]:
    return {
        "ok": True,
        "app": APP_TITLE,
        "version": APP_VERSION,
        "backend_dir_exists": BACKEND_DIR.exists(),
        "frontend_dist_exists": FRONTEND_DIST_DIR.exists(),
        "frontend_index_exists": (FRONTEND_DIST_DIR / "index.html").exists(),
        "frontend_assets_exists": FRONTEND_ASSETS_DIR.exists(),
    }


if FRONTEND_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_ASSETS_DIR)), name="frontend-assets")


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return {
        "message": "Herra frontend build not found.",
        "expected": str(index_file),
        "action": "Build the frontend before starting the production server.",
    }


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend_spa(full_path: str):
    if full_path.startswith("api/") or full_path == "server/health":
        return {
            "detail": "Route not found.",
            "path": full_path,
        }

    target_file = FRONTEND_DIST_DIR / full_path
    if target_file.exists() and target_file.is_file():
        return FileResponse(target_file)

    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return {
        "message": "Herra frontend build not found.",
        "expected": str(index_file),
        "action": "Build the frontend before starting the production server.",
    }