from __future__ import annotations

from typing import Any, Dict, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Meta(BaseModel):
    request_id: str
    # Keep as str because contracts.py returns ISO strings
    timestamp: str


class ApiErrorModel(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    meta: Meta


class ApiErrorResponse(BaseModel):
    success: bool = False
    error: ApiErrorModel
    meta: Meta
