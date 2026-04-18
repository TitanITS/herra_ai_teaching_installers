from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_request_id(request: Request) -> str:
    rid = request.headers.get("X-Client-Request-Id")
    if rid and rid.strip():
        return rid.strip()
    return str(uuid4())


def ok(request_id: str, data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": message,
        "meta": {"request_id": request_id, "timestamp": _iso_now()},
    }


def err(request_id: str, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "success": False,
        "error": {"code": code, "message": message, "details": details or {}},
        "meta": {"request_id": request_id, "timestamp": _iso_now()},
    }


class ApiError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    rid = get_request_id(request)
    return JSONResponse(status_code=exc.status_code, content=err(rid, exc.code, exc.message, exc.details))


async def http_exception_handler(request: Request, exc) -> JSONResponse:
    """
    Converts FastAPI/Starlette HTTPException 'detail' responses into the S5 envelope.
    """
    rid = get_request_id(request)
    status = getattr(exc, "status_code", 500) or 500
    detail = getattr(exc, "detail", "Request failed")

    if status == 401:
        code = "UNAUTHORIZED"
    elif status == 403:
        code = "FORBIDDEN"
    elif status == 404:
        code = "NOT_FOUND"
    elif status == 429:
        code = "RATE_LIMITED"
    elif 400 <= status < 500:
        code = "VALIDATION_ERROR"
    else:
        code = "INTERNAL_ERROR"

    return JSONResponse(status_code=status, content=err(rid, code, str(detail)))


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = get_request_id(request)
    return JSONResponse(
        status_code=500,
        content=err(rid, "INTERNAL_ERROR", "Unexpected server error", {"exception": str(exc)}),
    )
