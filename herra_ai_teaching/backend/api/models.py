from pydantic import BaseModel
from typing import List, Optional


class TrustResponse(BaseModel):
    total: int
    trusted: int
    penalized: int


class ConfidenceResponse(BaseModel):
    average_tokens: int
    confidence: str
    confidence_score: float


class AuditEntry(BaseModel):
    id: int
    action: str
    reference_id: Optional[int]
    created_at: str


class AuditResponse(BaseModel):
    entries: List[AuditEntry]
