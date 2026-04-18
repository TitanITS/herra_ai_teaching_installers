# backend/api/jobs.py

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Request

from backend.api.contracts import ApiError, get_request_id, ok
from backend.storage.jobs_models import Job
from backend.storage.jobs_store import jobs_store

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _require_connector_key(request: Request) -> None:
    """
    Production-style connector authentication.

    If HERRA_CONNECTOR_KEY is set, every connector request must include:
      X-Connector-Key: <value>
    """
    import os

    expected = (os.environ.get("HERRA_CONNECTOR_KEY") or "").strip()
    if not expected:
        raise ApiError("forbidden", "Connector execution is disabled until HERRA_CONNECTOR_KEY is configured.")

    got = (request.headers.get("X-Connector-Key") or "").strip()
    if got != expected:
        raise ApiError("unauthorized", "Invalid connector key.")


def _dev_mode_enabled() -> bool:
    import os

    raw = (os.environ.get("HERRA_DEV_MODE") or "").strip().lower()
    return raw in ("1", "true", "yes", "on")


def _as_str_list(v: Any) -> List[str]:
    if v is None:
        return []
    if isinstance(v, list):
        out: List[str] = []
        for x in v:
            if isinstance(x, str) and x.strip():
                out.append(x.strip())
        return out
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []


@router.get("/next")
def connector_next_job(request: Request, connector_id: str) -> Dict[str, Any]:
    _require_connector_key(request)
    rid = get_request_id(request)

    job = jobs_store.pick_next_job(connector_id=connector_id)
    return ok(rid, data={"job": job.to_dict() if job else None})


@router.post("/{job_id}/complete")
def connector_complete_job(request: Request, job_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    _require_connector_key(request)
    rid = get_request_id(request)

    job = jobs_store.get_job(job_id)
    if not job:
        raise ApiError("not_found", f"Job not found: {job_id}")

    status = (body.get("status") or "").strip().lower()
    logs = body.get("logs")
    result = body.get("result")
    error = body.get("error")

    if logs is not None and not isinstance(logs, list):
        raise ApiError("invalid_request", "logs must be an array of strings.")

    if isinstance(logs, list):
        for line in logs:
            if isinstance(line, str) and line.strip():
                jobs_store.append_log(job_id, line.strip())

    if status == "failed":
        msg = (error or "").strip() if isinstance(error, str) else "Connector reported failure."
        jobs_store.set_error(job_id, msg)
        jobs_store.append_log(job_id, f"Job marked failed: {msg}")
        job2 = jobs_store.get_job(job_id)
        return ok(rid, data={"job": job2.to_dict() if job2 else job.to_dict()})

    if status != "succeeded":
        raise ApiError("invalid_request", "status must be 'succeeded' or 'failed'.")

    if result is None or not isinstance(result, dict):
        raise ApiError("invalid_request", "result must be an object when status=succeeded.")

    if job.job_type == "files_ingest":
        final_result = _complete_files_ingest(job_id=job_id, connector_result=result)
        jobs_store.set_result(job_id, final_result)
    else:
        jobs_store.set_result(job_id, result)

    jobs_store.append_log(job_id, "Job marked succeeded.")
    job2 = jobs_store.get_job(job_id)
    return ok(rid, data={"job": job2.to_dict() if job2 else job.to_dict()})


def _complete_files_ingest(job_id: str, connector_result: Dict[str, Any]) -> Dict[str, Any]:
    from backend.api.file_ingest import _chunk_by_paragraph, ingest_prepared_chunks

    files_val = connector_result.get("files")
    if not isinstance(files_val, list):
        raise ApiError("invalid_request", "files_ingest result must include files: []")

    entry_ids: List[int] = []
    entry_id_to_path: Dict[str, str] = {}
    total_chunks_ingested = 0
    files_ingested = 0

    for item in files_val:
        if not isinstance(item, dict):
            continue

        path = (item.get("path") or "").strip()
        text = item.get("text")

        if not path or not isinstance(text, str):
            continue

        chunks = _chunk_by_paragraph(text, chunk_size=600)
        ingest_res = ingest_prepared_chunks(chunks)
        ids = ingest_res.get("entry_ids") or []

        if isinstance(ids, list) and ids:
            files_ingested += 1
            total_chunks_ingested += int(ingest_res.get("chunks_ingested") or 0)
            for eid in ids:
                if isinstance(eid, int):
                    entry_ids.append(eid)
                    entry_id_to_path[str(eid)] = path

    entry_ids = sorted(set(entry_ids))

    jobs_store.append_log(
        job_id,
        f"Ingested {files_ingested}/{len(files_val)} file(s) into DB. chunks_ingested={total_chunks_ingested}.",
    )

    return {
        "status": "ok",
        "files_requested": len(files_val),
        "files_ingested": files_ingested,
        "chunks_ingested": total_chunks_ingested,
        "entry_ids": entry_ids,
        "entry_id_to_path": entry_id_to_path,
    }


@router.post("/ad-discovery/create")
def create_ad_discovery_job(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    rid = get_request_id(request)

    domain_hint = (body.get("domain_hint") or "").strip() or None
    server_only = bool(body.get("server_only", True))

    job = Job.new(
        job_type="ad_discovery",
        input={"domain_hint": domain_hint, "server_only": server_only},
        requested_by=None,
    )
    jobs_store.create_job(job)
    jobs_store.append_log(job.job_id, "Job created (ad_discovery). Waiting for connector execution...")

    return ok(rid, data={"job": job.to_dict()})


@router.post("/folder-scan/create")
def create_folder_scan_job(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    rid = get_request_id(request)

    root_paths = _as_str_list(body.get("root_paths"))
    if not root_paths:
        raise ApiError("invalid_request", "root_paths is required.")

    job_input: Dict[str, Any] = {
        "root_paths": root_paths,
        "include_globs": _as_str_list(body.get("include_globs")) or ["**/*"],
        "exclude_globs": _as_str_list(body.get("exclude_globs")) or [],
        "max_files": int(body.get("max_files") or 5000),
        "max_depth": int(body.get("max_depth") or 25),
    }

    job = Job.new(job_type="folder_scan", input=job_input, requested_by=None)
    jobs_store.create_job(job)
    jobs_store.append_log(job.job_id, "Job created (folder_scan). Waiting for connector execution...")

    return ok(rid, data={"job": job.to_dict()})


@router.post("/files-ingest/create")
def create_files_ingest_job(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    rid = get_request_id(request)

    paths = _as_str_list(body.get("paths"))
    if not paths:
        raise ApiError("invalid_request", "paths is required.")

    job_input: Dict[str, Any] = {
        "paths": paths,
        "max_chars": int(body.get("max_chars") or 5000),
    }

    job = Job.new(job_type="files_ingest", input=job_input, requested_by=None)
    jobs_store.create_job(job)
    jobs_store.append_log(job.job_id, "Job created (files_ingest). Waiting for connector execution...")

    return ok(rid, data={"job": job.to_dict()})


@router.get("/list")
def list_jobs(request: Request, limit: int = 50) -> Dict[str, Any]:
    rid = get_request_id(request)
    jobs = [j.to_dict() for j in jobs_store.list_jobs(limit=limit)]
    return ok(rid, data={"jobs": jobs})


@router.get("/{job_id}")
def get_job(request: Request, job_id: str) -> Dict[str, Any]:
    rid = get_request_id(request)
    job = jobs_store.get_job(job_id)
    if not job:
        raise ApiError("not_found", f"Job not found: {job_id}")
    return ok(rid, data={"job": job.to_dict()})


@router.post("/dev/mock-run/{job_id}")
def dev_mock_run(request: Request, job_id: str) -> Dict[str, Any]:
    rid = get_request_id(request)

    if not _dev_mode_enabled():
        raise ApiError("forbidden", "DEV mock run is disabled unless HERRA_DEV_MODE=true")

    job = jobs_store.get_job(job_id)
    if not job:
        raise ApiError("not_found", f"Job not found: {job_id}")

    if job.status in ("running", "succeeded"):
        return ok(rid, data={"job": job.to_dict()})

    if job.job_type != "ad_discovery":
        raise ApiError("invalid_request", f"DEV mock run not supported for job_type={job.job_type}")

    jobs_store.update_status(job_id, "running")
    jobs_store.append_log(job_id, "DEV mock runner started job execution...")

    result = {
        "computers": [
            {"name": "DC01", "fqdn": "dc01.example.local", "os": "Windows Server", "is_server": True},
            {"name": "FILE01", "fqdn": "file01.example.local", "os": "Windows Server", "is_server": True},
            {"name": "WIN10-123", "fqdn": "win10-123.example.local", "os": "Windows 10", "is_server": False},
        ],
        "server_only": bool(job.input.get("server_only", True)),
        "domain_hint": job.input.get("domain_hint"),
    }

    jobs_store.append_log(job_id, "DEV mock runner produced sample AD results.")
    jobs_store.set_result(job_id, result)

    job2 = jobs_store.get_job(job_id)
    return ok(rid, data={"job": job2.to_dict() if job2 else job.to_dict()})