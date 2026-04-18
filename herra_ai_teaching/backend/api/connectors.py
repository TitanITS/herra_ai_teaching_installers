from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Request

from backend.api.contracts import ApiError, get_request_id, ok
from backend.api.dependencies import ApiKeyDep
from backend.storage.connectors_store import connectors_store
from backend.storage.enrollment_store import enrollment_store

router = APIRouter(prefix="/connectors", tags=["connectors"])


def _require_connector_key(request: Request) -> None:
    """
    Production-style connector authentication.

    If HERRA_CONNECTOR_KEY is set, every connector runtime request must include:
      X-Connector-Key: <value>
    """
    import os

    expected = (os.environ.get("HERRA_CONNECTOR_KEY") or "").strip()
    if not expected:
        raise ApiError("forbidden", "Connector registration is disabled until HERRA_CONNECTOR_KEY is configured.")

    got = (request.headers.get("X-Connector-Key") or "").strip()
    if got != expected:
        raise ApiError("unauthorized", "Invalid connector key.")


@router.post("/bootstrap/create", dependencies=[ApiKeyDep])
def create_bootstrap_token(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Admin/API-key protected endpoint to create a one-time bootstrap token.
    Current DEV design returns the token in the response so it can be copied into installer/bootstrap flow.

    Titan now sends deployment-aware context values. For this first pass, we preserve those values
    in the returned response and also fold the most important context into the persisted label.
    """
    rid = get_request_id(request)

    deployment_code = (body.get("deployment_code") or "").strip()
    connector_name = (body.get("connector_name") or "").strip()
    site_label = (body.get("site_label") or "").strip()

    requested_label = (body.get("label") or "").strip()
    if requested_label:
        label = requested_label
    else:
        label_parts = [part for part in [deployment_code, site_label, connector_name] if part]
        label = " | ".join(label_parts) if label_parts else "connector-bootstrap"

    expires_minutes = int(body.get("expires_minutes") or 60)

    tok = enrollment_store.create(label=label, expires_minutes=expires_minutes)

    bootstrap_context = {
        "deployment_id": body.get("deployment_id"),
        "deployment_code": deployment_code or None,
        "customer_account_id": body.get("customer_account_id"),
        "customer_account_name": body.get("customer_account_name"),
        "titan_connector_slot_id": body.get("titan_connector_slot_id"),
        "connector_name": connector_name or None,
        "site_label": site_label or None,
        "operating_system": body.get("operating_system"),
        "architecture": body.get("architecture"),
        "release_id": body.get("release_id"),
        "release_version": body.get("release_version"),
        "requested_by_email": body.get("requested_by_email"),
    }

    return ok(
        rid,
        data={
            "bootstrap": tok.to_dict(include_secret=True),
            "context": bootstrap_context,
        },
    )


@router.get("/bootstrap/list", dependencies=[ApiKeyDep])
def list_bootstrap_tokens(request: Request) -> Dict[str, Any]:
    rid = get_request_id(request)
    items = [t.to_dict(include_secret=False) for t in enrollment_store.list_tokens()]
    return ok(rid, data={"bootstrap_tokens": items})


@router.post("/enroll")
def enroll_connector(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    One-time bootstrap enrollment.

    Current bridge design:
    - validate one-time bootstrap token
    - register/reuse connector identity
    - return the current runtime connector key so the installer/service can store it

    Later, this becomes per-connector secret issuance.
    """
    import os

    rid = get_request_id(request)

    bootstrap_token = (body.get("bootstrap_token") or "").strip()
    name = (body.get("name") or "").strip()
    os_name = (body.get("os") or "").strip()
    meta = body.get("meta") or {}

    if not bootstrap_token:
        raise ApiError("invalid_request", "bootstrap_token is required.")
    if not name:
        raise ApiError("invalid_request", "name is required.")
    if not os_name:
        raise ApiError("invalid_request", "os is required.")
    if not isinstance(meta, dict):
        raise ApiError("invalid_request", "meta must be an object.")

    try:
        enrollment_store.use_token(bootstrap_token, connector_name=name)
    except ValueError as e:
        raise ApiError("unauthorized", str(e), status_code=401)

    runtime_key = (os.environ.get("HERRA_CONNECTOR_KEY") or "").strip()
    if not runtime_key:
        raise ApiError("forbidden", "Connector runtime key is not configured on the backend.")

    c = connectors_store.register(name=name, os_name=os_name, meta=meta)

    return ok(
        rid,
        data={
            "connector": c,
            "connector_runtime_key": runtime_key,
        },
    )


@router.post("/register")
def register_connector(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    _require_connector_key(request)
    rid = get_request_id(request)

    name = (body.get("name") or "").strip()
    os_name = (body.get("os") or "").strip()
    meta = body.get("meta") or {}

    if not name:
        raise ApiError("invalid_request", "name is required.")
    if not os_name:
        raise ApiError("invalid_request", "os is required.")
    if not isinstance(meta, dict):
        raise ApiError("invalid_request", "meta must be an object.")

    c = connectors_store.register(name=name, os_name=os_name, meta=meta)
    return ok(rid, data={"connector": c})


@router.post("/heartbeat")
def connector_heartbeat(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    _require_connector_key(request)
    rid = get_request_id(request)

    connector_id = (body.get("connector_id") or "").strip()
    if not connector_id:
        raise ApiError("invalid_request", "connector_id is required.")

    c = connectors_store.heartbeat(connector_id)
    if not c:
        raise ApiError("not_found", f"Connector not found: {connector_id}")

    return ok(rid, data={"connector": c})


@router.get("/status")
def connectors_status(request: Request) -> Dict[str, Any]:
    rid = get_request_id(request)
    connectors = connectors_store.list_online(online_within_seconds=90)
    return ok(rid, data={"connectors": connectors})