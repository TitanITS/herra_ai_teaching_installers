"""
Ingest API (S5 + Swagger typed)

Purpose:
- Accept user text input
- Store it into the database
- Return stable S5 envelope responses
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from backend.api.dependencies import ApiKeyDep
from backend.api.contracts import ok, ApiError, get_request_id
from backend.api.schemas.envelope import ApiResponse
from backend.api.schemas.ingest import IngestTextData, IngestListData, PenalizeData

from backend.storage.database import insert_text, list_text, penalize_text
from backend.utils.content_classifier import classify_content

router = APIRouter(prefix="/ingest", tags=["ingest"])


class TextIn(BaseModel):
    text: str


@router.post("/text", dependencies=[ApiKeyDep], response_model=ApiResponse[IngestTextData])
def ingest_text(payload: TextIn, request: Request):
    rid = get_request_id(request)

    text = (payload.text or "").strip()
    if not text:
        raise ApiError("VALIDATION_ERROR", "Text cannot be empty", 400, {"fields": {"text": "Required"}})

    entry_id = insert_text(text)
    classification = classify_content(text)
    tokens = len(text.split())

    data = IngestTextData(
        status="learned",
        tokens=tokens,
        classification=classification,
        entry_id=entry_id if isinstance(entry_id, int) else None,
    )
    return ok(rid, data)


@router.get("/list", dependencies=[ApiKeyDep], response_model=ApiResponse[IngestListData])
def ingest_list(request: Request):
    rid = get_request_id(request)
    return ok(rid, {"entries": list_text()})


@router.post("/penalize/{entry_id}", dependencies=[ApiKeyDep], response_model=ApiResponse[PenalizeData])
def ingest_penalize(entry_id: int, request: Request):
    rid = get_request_id(request)
    penalize_text(entry_id)
    data = PenalizeData(status="penalized", entry_id=entry_id)
    return ok(rid, data)
