from __future__ import annotations

import json
from typing import Any, Dict
from urllib import error, request

from app.core.config import settings
from app.core.exceptions import bad_request_exception


class HerraBridgeError(RuntimeError):
    pass


def _normalize_base_url(value: str) -> str:
    return value.rstrip("/")


def create_herra_bootstrap_token(*, body: Dict[str, Any]) -> Dict[str, Any]:
    base_url = _normalize_base_url(settings.HERRA_BACKEND_BASE_URL)
    if not base_url:
        raise HerraBridgeError("HERRA_BACKEND_BASE_URL is not configured.")

    if not settings.HERRA_API_KEY:
        raise HerraBridgeError("HERRA_API_KEY is not configured.")

    url = f"{base_url}/connectors/bootstrap/create"
    payload = json.dumps(body).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": settings.HERRA_API_KEY,
    }

    req = request.Request(url=url, data=payload, headers=headers, method="POST")

    try:
        with request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HerraBridgeError(
            f"Herra bootstrap request failed with HTTP {exc.code}. Response: {detail or 'no response body'}"
        ) from exc
    except error.URLError as exc:
        raise HerraBridgeError(f"Herra backend could not be reached at {url}. {exc.reason}") from exc
    except Exception as exc:  # pragma: no cover
        raise HerraBridgeError(f"Herra bootstrap request failed unexpectedly. {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HerraBridgeError("Herra bootstrap response was not valid JSON.") from exc

    bootstrap = ((data.get("data") or {}).get("bootstrap") or {}) if isinstance(data, dict) else {}
    if not bootstrap:
        raise HerraBridgeError("Herra bootstrap response did not include bootstrap data.")

    return bootstrap


def create_herra_bootstrap_token_or_raise(*, body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return create_herra_bootstrap_token(body=body)
    except HerraBridgeError as exc:
        raise bad_request_exception(str(exc)) from exc