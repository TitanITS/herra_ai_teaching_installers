from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AuditEntry(BaseModel):
    id: int
    action: str
    reference_id: Optional[int] = None
    created_at: str


class AuditData(BaseModel):
    entries: List[AuditEntry]


# Defensive models because your DB layer may return different shapes depending on availability.
class TrustData(BaseModel):
    total: Optional[int] = None
    trusted: Optional[int] = None
    penalized: Optional[int] = None

    # Fallback shape
    status: Optional[str] = None
    reason: Optional[str] = None


class ConfidenceData(BaseModel):
    average_tokens: Optional[int] = None
    confidence: Optional[str] = None
    confidence_score: Optional[float] = None

    # Fallback shape
    status: Optional[str] = None
    reason: Optional[str] = None


class AiSourcesData(BaseModel):
    sources: List[Dict[str, Any]]


class AiSourceData(BaseModel):
    active_source: str


class AiSourceSetData(BaseModel):
    active_source: str
    status: str
