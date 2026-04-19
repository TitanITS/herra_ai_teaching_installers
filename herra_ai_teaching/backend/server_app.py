from __future__ import annotations

import asyncio
import contextlib
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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
from backend.license_manager import (
    bootstrap_license_if_missing,
    get_license_state,
    get_license_status_payload,
)
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

PROTECTED_API_PREFIXES = (
    "/system",
    "/ingest",
    "/connectors",
    "/jobs",
    "/chat",
)

LICENSE_STATUS_PATH = "/server/license/status"
BACKGROUND_REVALIDATE_LOOP_SECONDS = 30

app = FastAPI(title=APP_TITLE, version=APP_VERSION)


async def _license_revalidation_loop() -> None:
    while True:
        try:
            get_license_state(force_refresh=False)
        except Exception:
            pass
        await asyncio.sleep(BACKGROUND_REVALIDATE_LOOP_SECONDS)


@app.on_event("startup")
async def startup_init_db() -> None:
    bootstrap_license_if_missing()
    init_db()
    app.state.license_revalidation_task = asyncio.create_task(_license_revalidation_loop())


@app.on_event("shutdown")
async def shutdown_revalidation_task() -> None:
    task = getattr(app.state, "license_revalidation_task", None)
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


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


@app.middleware("http")
async def license_enforcement_middleware(request: Request, call_next):
    path = request.url.path

    if any(path.startswith(prefix) for prefix in PROTECTED_API_PREFIXES):
        license_state = get_license_state(force_refresh=False)
        if not license_state.allows_runtime:
            return JSONResponse(
                status_code=403,
                content={
                    "success": False,
                    "error": {
                        "code": "LICENSE_INACTIVE",
                        "message": "This private deployment license is inactive.",
                        "details": license_state.to_dict(),
                    },
                    "meta": {
                        "request_id": get_request_id(request),
                    },
                },
            )

    return await call_next(request)


app.include_router(system_router)
app.include_router(ingest_router)
app.include_router(connectors_router)
app.include_router(jobs_router)
app.include_router(chat_router)


@app.get("/server/health")
def server_health() -> dict[str, object]:
    license_state = get_license_state(force_refresh=False)
    return {
        "ok": True,
        "app": APP_TITLE,
        "version": APP_VERSION,
        "backend_dir_exists": BACKEND_DIR.exists(),
        "frontend_dist_exists": FRONTEND_DIST_DIR.exists(),
        "frontend_index_exists": (FRONTEND_DIST_DIR / "index.html").exists(),
        "frontend_assets_exists": FRONTEND_ASSETS_DIR.exists(),
        "license_status": license_state.status,
        "license_allows_runtime": license_state.allows_runtime,
        "license_reason": license_state.reason,
        "license_source": license_state.source,
        "license_file": license_state.license_file,
        "license_last_validated_at": license_state.last_validated_at,
        "license_last_remote_check_at": license_state.last_remote_check_at,
    }


@app.get(LICENSE_STATUS_PATH)
def server_license_status() -> dict[str, object]:
    return get_license_status_payload(force_refresh=False)


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
    if full_path.startswith("api/") or full_path in {"server/health", "server/license/status"}:
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