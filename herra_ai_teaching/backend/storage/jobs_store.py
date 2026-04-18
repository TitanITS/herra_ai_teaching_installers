# backend/storage/jobs_store.py

from __future__ import annotations

from typing import Dict, List, Optional

from backend.storage.database import (
    append_job_log,
    create_job_record,
    get_job_record,
    list_job_records,
    pick_next_queued_job_record,
    set_job_error,
    set_job_result,
    update_job_status,
)
from backend.storage.jobs_models import Job, now_utc


def _to_job(d: Dict[str, object]) -> Job:
    return Job(
        job_id=str(d["job_id"]),
        job_type=d["job_type"],  # type: ignore[arg-type]
        status=d["status"],  # type: ignore[arg-type]
        created_at=str(d["created_at"]),
        updated_at=str(d["updated_at"]),
        requested_by=d.get("requested_by"),  # type: ignore[arg-type]
        input=d.get("input") or {},  # type: ignore[arg-type]
        logs=d.get("logs") or [],  # type: ignore[arg-type]
        result=d.get("result"),  # type: ignore[arg-type]
        error=d.get("error"),  # type: ignore[arg-type]
    )


class PersistentJobsStore:
    """
    SQLite-backed jobs store.

    Jobs now survive backend restart.
    """

    def create_job(self, job: Job) -> Job:
        create_job_record(job.to_dict())
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        row = get_job_record(job_id)
        if row is None:
            return None
        return _to_job(row)

    def list_jobs(self, limit: int = 50) -> List[Job]:
        rows = list_job_records(limit=limit)
        return [_to_job(r) for r in rows]

    def append_log(self, job_id: str, line: str) -> None:
        append_job_log(job_id, line, updated_at=now_utc())

    def update_status(self, job_id: str, status: str) -> None:
        update_job_status(job_id, status, updated_at=now_utc())

    def set_result(self, job_id: str, result: Dict[str, object]) -> None:
        set_job_result(job_id, result, updated_at=now_utc())

    def set_error(self, job_id: str, error: str) -> None:
        set_job_error(job_id, error, updated_at=now_utc())

    def pick_next_job(self, connector_id: str) -> Optional[Job]:
        row = pick_next_queued_job_record(connector_id=connector_id, updated_at=now_utc())
        if row is None:
            return None
        return _to_job(row)


jobs_store = PersistentJobsStore()