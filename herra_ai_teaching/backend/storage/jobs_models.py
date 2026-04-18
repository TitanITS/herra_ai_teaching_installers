# backend/storage/jobs_models.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
import uuid

JobType = Literal["ad_discovery", "folder_scan", "files_ingest"]
JobStatus = Literal["queued", "running", "succeeded", "failed"]


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Job:
    job_id: str
    job_type: JobType
    status: JobStatus
    created_at: str
    updated_at: str
    requested_by: Optional[str] = None
    input: Dict[str, Any] = field(default_factory=dict)
    logs: List[str] = field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    @staticmethod
    def new(job_type: JobType, input: Dict[str, Any], requested_by: Optional[str] = None) -> "Job":
        t = now_utc()
        return Job(
            job_id=str(uuid.uuid4()),
            job_type=job_type,
            status="queued",
            created_at=t,
            updated_at=t,
            requested_by=requested_by,
            input=input or {},
            logs=[],
            result=None,
            error=None,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "requested_by": self.requested_by,
            "input": self.input,
            "logs": self.logs,
            "result": self.result,
            "error": self.error,
        }