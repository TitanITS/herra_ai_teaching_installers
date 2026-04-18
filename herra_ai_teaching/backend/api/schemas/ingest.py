from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class IngestTextData(BaseModel):
    status: str
    tokens: int
    classification: Dict[str, Any]
    entry_id: Optional[int] = None


class IngestListEntry(BaseModel):
    id: int
    text: str
    tokens: int
    penalized: bool
    created_at: str


class IngestListData(BaseModel):
    entries: List[IngestListEntry]


class PenalizeData(BaseModel):
    status: str
    entry_id: int
