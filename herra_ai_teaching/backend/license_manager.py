from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import platform
import socket
import uuid
from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

APP_NAME = "Herra AI Teaching Server"
APP_VERSION = "1.0.0"
LICENSE_SCHEMA_VERSION = 1
DEFAULT_LICENSE_TYPE = "private_deployment"
DEFAULT_LICENSE_STATUS = "active"
DEFAULT_OFFLINE_GRACE_HOURS = 72
DEFAULT_BOOTSTRAP_TERM_DAYS = 365
LICENSE_STATUSES_ALLOWING_RUNTIME = {"active"}

DEFAULT_ACTIVE_REVALIDATE_SECONDS = 120
DEFAULT_INACTIVE_REVALIDATE_SECONDS = 30

PROGRAM_DATA_ROOT = Path(os.getenv("PROGRAMDATA", r"C:\ProgramData"))
LICENSE_BASE_DIR = PROGRAM_DATA_ROOT / "TitanITS" / "HerraAITeaching"
LICENSE_FILE = LICENSE_BASE_DIR / "license.json"
SIGNING_KEY_FILE = LICENSE_BASE_DIR / "license.key"
DEPLOYMENT_CONFIG_FILE = LICENSE_BASE_DIR / "deployment_config.json"
DEFAULT_BOOTSTRAP_PATH = Path(__file__).resolve().parent.parent / "deployment_bootstrap.json"


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _isoformat(dt: datetime) -> str:
    return dt.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse_iso8601(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _ensure_license_dir() -> None:
    LICENSE_BASE_DIR.mkdir(parents=True, exist_ok=True)


def _load_or_create_signing_key() -> bytes:
    _ensure_license_dir()
    if SIGNING_KEY_FILE.exists():
        return SIGNING_KEY_FILE.read_bytes()
    key = os.urandom(32)
    SIGNING_KEY_FILE.write_bytes(key)
    return key


def _canonical_payload(payload: dict[str, Any]) -> bytes:
    payload_copy = dict(payload)
    payload_copy.pop("signature", None)
    return json.dumps(payload_copy, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sign_payload(payload: dict[str, Any]) -> str:
    key = _load_or_create_signing_key()
    return hmac.new(key, _canonical_payload(payload), hashlib.sha256).hexdigest()


def _write_license(payload: dict[str, Any]) -> None:
    _ensure_license_dir()
    payload_to_write = dict(payload)
    payload_to_write["signature"] = _sign_payload(payload_to_write)
    LICENSE_FILE.write_text(json.dumps(payload_to_write, indent=2), encoding="utf-8")


def _read_json_file(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json_file(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _read_license_file() -> dict[str, Any] | None:
    return _read_json_file(LICENSE_FILE)


def _fingerprint_source() -> dict[str, Any]:
    return {
        "hostname": socket.gethostname(),
        "fqdn": socket.getfqdn(),
        "platform": platform.platform(),
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python_implementation": platform.python_implementation(),
        "mac_address": f"{uuid.getnode():012x}",
        "computer_name_env": os.getenv("COMPUTERNAME", ""),
        "processor_identifier": os.getenv("PROCESSOR_IDENTIFIER", ""),
        "system_drive": os.getenv("SystemDrive", ""),
    }


def get_machine_fingerprint() -> str:
    source = _fingerprint_source()
    serialized = json.dumps(source, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()


def _load_bootstrap_payload(bootstrap_path: Path) -> dict[str, Any]:
    payload = _read_json_file(bootstrap_path)
    if payload is None:
        raise FileNotFoundError(f"Bootstrap file was not found: {bootstrap_path}")
    return payload


def read_deployment_config() -> dict[str, Any] | None:
    return _read_json_file(DEPLOYMENT_CONFIG_FILE)


def _write_deployment_config(payload: dict[str, Any]) -> None:
    _write_json_file(DEPLOYMENT_CONFIG_FILE, payload)


def _activation_request_payload(bootstrap: dict[str, Any]) -> dict[str, Any]:
    customer_account_name = str(bootstrap.get("customer_account_name") or "Demo Customer").strip()
    deployment_name = str(bootstrap.get("deployment_name") or f"{socket.gethostname()} Production").strip()
    platform_name = str(bootstrap.get("platform") or "windows").strip().lower()
    environment_type = str(bootstrap.get("environment_type") or "production").strip().lower()
    region = str(bootstrap.get("region") or "customer-site").strip()

    return {
        "customer_account_name": customer_account_name,
        "deployment_name": deployment_name,
        "platform": platform_name,
        "environment_type": environment_type,
        "region": region,
        "hostname": socket.gethostname(),
        "machine_fingerprint": get_machine_fingerprint(),
    }


def activate_from_bootstrap(bootstrap_path: Path = DEFAULT_BOOTSTRAP_PATH) -> dict[str, Any]:
    existing = read_deployment_config()
    if existing is not None:
        return existing

    bootstrap = _load_bootstrap_payload(bootstrap_path)
    activation_url = str(bootstrap.get("activation_url") or "").strip()
    validation_url = str(bootstrap.get("validation_url") or "").strip()
    installer_secret = str(bootstrap.get("installer_master_secret") or "").strip()

    if not activation_url:
        raise RuntimeError("deployment_bootstrap.json is missing activation_url.")
    if not validation_url:
        raise RuntimeError("deployment_bootstrap.json is missing validation_url.")
    if not installer_secret:
        raise RuntimeError("deployment_bootstrap.json is missing installer_master_secret.")

    body = json.dumps(_activation_request_payload(bootstrap)).encode("utf-8")
    request = Request(
        activation_url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Titan-Installer-Secret": installer_secret,
        },
    )

    with urlopen(request, timeout=15) as response:
        raw = response.read().decode("utf-8")

    payload = json.loads(raw) if raw else {}
    if isinstance(payload, dict) and "data" in payload and isinstance(payload["data"], dict):
        payload = payload["data"]

    deployment_config = {
        "deployment_id": str(payload.get("deployment_id") or "").strip(),
        "deployment_number": int(payload.get("deployment_number") or 0),
        "deployment_secret": str(payload.get("deployment_secret") or "").strip(),
        "validation_url": validation_url or str(payload.get("validation_url") or "").strip(),
        "customer_account_id": int(payload.get("customer_account_id") or 0),
        "customer_account_name": str(payload.get("customer_account_name") or bootstrap.get("customer_account_name") or ""),
        "deployment_name": str(payload.get("deployment_name") or bootstrap.get("deployment_name") or socket.gethostname()),
        "platform": str(payload.get("platform") or bootstrap.get("platform") or "windows"),
        "environment_type": str(payload.get("environment_type") or bootstrap.get("environment_type") or "production"),
        "region": str(payload.get("region") or bootstrap.get("region") or "customer-site"),
        "license_status": str(payload.get("license_status") or DEFAULT_LICENSE_STATUS),
        "license_expires_at": str(payload.get("license_expires_at") or ""),
        "offline_grace_hours": int(payload.get("offline_grace_hours") or DEFAULT_OFFLINE_GRACE_HOURS),
        "license_shared_secret": str(bootstrap.get("license_shared_secret") or "").strip(),
        "activated_at": _isoformat(_utc_now()),
    }

    if not deployment_config["deployment_id"]:
        raise RuntimeError("Titan activation did not return deployment_id.")
    if not deployment_config["deployment_secret"]:
        raise RuntimeError("Titan activation did not return deployment_secret.")
    if not deployment_config["license_shared_secret"]:
        raise RuntimeError("deployment_bootstrap.json is missing license_shared_secret.")

    _write_deployment_config(deployment_config)
    return deployment_config


def ensure_deployment_config(bootstrap_path: Path = DEFAULT_BOOTSTRAP_PATH) -> dict[str, Any]:
    existing = read_deployment_config()
    if existing is not None:
        return existing
    return activate_from_bootstrap(bootstrap_path)


def _active_revalidate_seconds() -> int:
    raw = os.getenv("HERRA_LICENSE_ACTIVE_REVALIDATE_SECONDS", "").strip()
    try:
        value = int(raw)
    except ValueError:
        value = DEFAULT_ACTIVE_REVALIDATE_SECONDS
    return max(15, value)


def _inactive_revalidate_seconds() -> int:
    raw = os.getenv("HERRA_LICENSE_INACTIVE_REVALIDATE_SECONDS", "").strip()
    try:
        value = int(raw)
    except ValueError:
        value = DEFAULT_INACTIVE_REVALIDATE_SECONDS
    return max(10, value)


def _new_license_payload() -> dict[str, Any]:
    now = _utc_now()
    expires_at = now + timedelta(days=DEFAULT_BOOTSTRAP_TERM_DAYS)
    config = read_deployment_config() or {}
    deployment_id = str(config.get("deployment_id") or str(uuid.uuid4())).strip()
    deployment_name = str(config.get("deployment_name") or socket.gethostname()).strip()
    remote_validation_url = str(config.get("validation_url") or os.getenv("TITAN_LICENSE_VALIDATE_URL", "")).strip()
    offline_grace_hours = int(config.get("offline_grace_hours") or DEFAULT_OFFLINE_GRACE_HOURS)

    return {
        "schema_version": LICENSE_SCHEMA_VERSION,
        "app": APP_NAME,
        "app_version": APP_VERSION,
        "deployment_id": deployment_id,
        "deployment_name": deployment_name,
        "license_type": DEFAULT_LICENSE_TYPE,
        "status": DEFAULT_LICENSE_STATUS,
        "issued_at": _isoformat(now),
        "expires_at": _isoformat(expires_at),
        "machine_fingerprint": get_machine_fingerprint(),
        "offline_grace_hours": offline_grace_hours,
        "last_remote_check_at": None,
        "last_validated_at": _isoformat(now),
        "remote_enforcement_enabled": bool(remote_validation_url),
        "remote_validation_url": remote_validation_url,
        "disable_reason": "",
        "license_source": "local_bootstrap",
    }


def bootstrap_license_if_missing() -> dict[str, Any]:
    payload = _read_license_file()
    if payload is not None:
        return payload
    payload = _new_license_payload()
    _write_license(payload)
    return _read_license_file() or payload


@dataclass(slots=True)
class LicenseState:
    ok: bool
    status: str
    allows_runtime: bool
    reason: str
    source: str
    deployment_id: str
    deployment_name: str
    license_type: str
    expires_at: str | None
    issued_at: str | None
    last_validated_at: str | None
    last_remote_check_at: str | None
    offline_grace_hours: int
    fingerprint_match: bool
    signature_valid: bool
    remote_enforcement_enabled: bool
    remote_validation_url: str
    license_file: str
    deployment_config_file: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


REMOTE_TIMEOUT_SECONDS = 10


def _build_state(
    payload: dict[str, Any],
    *,
    ok: bool,
    allows_runtime: bool,
    reason: str,
    source: str,
    fingerprint_match: bool,
    signature_valid: bool,
) -> LicenseState:
    return LicenseState(
        ok=ok,
        status=str(payload.get("status") or "unknown"),
        allows_runtime=allows_runtime,
        reason=reason,
        source=source,
        deployment_id=str(payload.get("deployment_id") or ""),
        deployment_name=str(payload.get("deployment_name") or ""),
        license_type=str(payload.get("license_type") or ""),
        expires_at=payload.get("expires_at"),
        issued_at=payload.get("issued_at"),
        last_validated_at=payload.get("last_validated_at"),
        last_remote_check_at=payload.get("last_remote_check_at"),
        offline_grace_hours=int(payload.get("offline_grace_hours") or DEFAULT_OFFLINE_GRACE_HOURS),
        fingerprint_match=fingerprint_match,
        signature_valid=signature_valid,
        remote_enforcement_enabled=bool(payload.get("remote_enforcement_enabled")),
        remote_validation_url=str(payload.get("remote_validation_url") or ""),
        license_file=str(LICENSE_FILE),
        deployment_config_file=str(DEPLOYMENT_CONFIG_FILE),
    )


def _signature_is_valid(payload: dict[str, Any]) -> bool:
    signature = str(payload.get("signature") or "")
    if not signature:
        return False
    expected = _sign_payload(payload)
    return hmac.compare_digest(signature, expected)


def _write_remote_result(payload: dict[str, Any], response_data: dict[str, Any]) -> dict[str, Any]:
    updated = dict(payload)
    updated["status"] = str(response_data.get("status") or updated.get("status") or DEFAULT_LICENSE_STATUS).strip().lower()
    updated["disable_reason"] = str(response_data.get("disable_reason") or "").strip()
    updated["last_remote_check_at"] = _isoformat(_utc_now())

    if response_data.get("expires_at"):
        updated["expires_at"] = str(response_data["expires_at"])

    if response_data.get("offline_grace_hours") is not None:
        try:
            updated["offline_grace_hours"] = int(response_data["offline_grace_hours"])
        except (TypeError, ValueError):
            pass

    if updated["status"] in LICENSE_STATUSES_ALLOWING_RUNTIME:
        updated["last_validated_at"] = _isoformat(_utc_now())

    if response_data.get("remote_enforcement_enabled") is not None:
        updated["remote_enforcement_enabled"] = bool(response_data["remote_enforcement_enabled"])

    if response_data.get("remote_validation_url") is not None:
        updated["remote_validation_url"] = str(response_data.get("remote_validation_url") or updated.get("remote_validation_url") or "")

    updated["license_source"] = "remote_validation"
    _write_license(updated)
    return _read_license_file() or updated


def _remote_validation_enabled(payload: dict[str, Any]) -> bool:
    file_enabled = bool(payload.get("remote_enforcement_enabled"))
    file_url = str(payload.get("remote_validation_url") or "").strip()
    return bool(file_enabled and file_url)


def _remote_validation_url(payload: dict[str, Any]) -> str:
    return str(payload.get("remote_validation_url") or "").strip()


def _deployment_secret() -> str:
    config = read_deployment_config() or {}
    return str(config.get("deployment_secret") or "").strip()


def _shared_secret() -> str:
    config = read_deployment_config() or {}
    return str(config.get("license_shared_secret") or "").strip()


def _post_remote_validation(payload: dict[str, Any]) -> dict[str, Any]:
    url = _remote_validation_url(payload)
    if not url:
        raise URLError("Remote license validation URL is not configured.")

    shared_secret = _shared_secret()
    if not shared_secret:
        raise URLError("Remote license validation shared secret is not configured.")

    deployment_secret = _deployment_secret()
    if not deployment_secret:
        raise URLError("Deployment secret is not configured.")

    body = json.dumps(
        {
            "app": APP_NAME,
            "app_version": APP_VERSION,
            "deployment_id": payload.get("deployment_id"),
            "deployment_name": payload.get("deployment_name"),
            "license_type": payload.get("license_type"),
            "machine_fingerprint": get_machine_fingerprint(),
            "hostname": socket.gethostname(),
            "deployment_secret": deployment_secret,
            "issued_at": payload.get("issued_at"),
            "expires_at": payload.get("expires_at"),
            "last_validated_at": payload.get("last_validated_at"),
            "last_remote_check_at": payload.get("last_remote_check_at"),
        }
    ).encode("utf-8")

    request = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Titan-License-Secret": shared_secret,
        },
    )

    with urlopen(request, timeout=REMOTE_TIMEOUT_SECONDS) as response:
        raw = response.read().decode("utf-8")

    parsed = json.loads(raw) if raw else {}
    if isinstance(parsed, dict) and "data" in parsed and isinstance(parsed["data"], dict):
        parsed = parsed["data"]
    return parsed


def _within_offline_grace(payload: dict[str, Any]) -> bool:
    last_validated_at = _parse_iso8601(payload.get("last_validated_at"))
    if last_validated_at is None:
        return False
    grace_hours = int(payload.get("offline_grace_hours") or DEFAULT_OFFLINE_GRACE_HOURS)
    return _utc_now() <= last_validated_at + timedelta(hours=grace_hours)


def _remote_check_due(payload: dict[str, Any]) -> bool:
    status = str(payload.get("status") or DEFAULT_LICENSE_STATUS).strip().lower()
    interval_seconds = _active_revalidate_seconds() if status in LICENSE_STATUSES_ALLOWING_RUNTIME else _inactive_revalidate_seconds()
    last_remote_check_at = _parse_iso8601(payload.get("last_remote_check_at"))
    if last_remote_check_at is None:
        return True
    return _utc_now() >= last_remote_check_at + timedelta(seconds=interval_seconds)


def refresh_license_state(force: bool = False) -> LicenseState:
    payload = bootstrap_license_if_missing()

    signature_valid = _signature_is_valid(payload)
    if not signature_valid:
        return _build_state(
            payload,
            ok=False,
            allows_runtime=False,
            reason="Local license signature is invalid. The license file appears to have been modified.",
            source="local_signature_check",
            fingerprint_match=False,
            signature_valid=False,
        )

    fingerprint_match = hmac.compare_digest(
        str(payload.get("machine_fingerprint") or ""),
        get_machine_fingerprint(),
    )
    if not fingerprint_match:
        return _build_state(
            payload,
            ok=False,
            allows_runtime=False,
            reason="Machine fingerprint mismatch detected. This installation is not licensed for this device.",
            source="local_fingerprint_check",
            fingerprint_match=False,
            signature_valid=True,
        )

    expires_at = _parse_iso8601(payload.get("expires_at"))
    if expires_at is not None and _utc_now() > expires_at:
        payload = dict(payload)
        payload["status"] = "expired"
        payload["disable_reason"] = "The private deployment license has expired."
        _write_license(payload)
        payload = _read_license_file() or payload
        return _build_state(
            payload,
            ok=False,
            allows_runtime=False,
            reason=str(payload.get("disable_reason") or "The private deployment license has expired."),
            source="local_expiration_check",
            fingerprint_match=True,
            signature_valid=True,
        )

    status = str(payload.get("status") or DEFAULT_LICENSE_STATUS).strip().lower()

    if _remote_validation_enabled(payload) and (force or _remote_check_due(payload)):
        try:
            remote_payload = _post_remote_validation(payload)
            payload = _write_remote_result(payload, remote_payload)
            status = str(payload.get("status") or DEFAULT_LICENSE_STATUS).strip().lower()

            if status in LICENSE_STATUSES_ALLOWING_RUNTIME:
                return _build_state(
                    payload,
                    ok=True,
                    allows_runtime=True,
                    reason="License validated successfully.",
                    source="remote_validation",
                    fingerprint_match=True,
                    signature_valid=True,
                )

            return _build_state(
                payload,
                ok=False,
                allows_runtime=False,
                reason=str(payload.get("disable_reason") or f"Remote licensing returned status '{status}'."),
                source="remote_validation",
                fingerprint_match=True,
                signature_valid=True,
            )
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            if status in LICENSE_STATUSES_ALLOWING_RUNTIME and _within_offline_grace(payload):
                return _build_state(
                    payload,
                    ok=True,
                    allows_runtime=True,
                    reason=f"Remote license validation is unavailable. Running within offline grace period. {exc}",
                    source="offline_grace",
                    fingerprint_match=True,
                    signature_valid=True,
                )

            if status not in LICENSE_STATUSES_ALLOWING_RUNTIME:
                return _build_state(
                    payload,
                    ok=False,
                    allows_runtime=False,
                    reason=str(payload.get("disable_reason") or f"License status '{status}' does not allow this deployment to run."),
                    source="local_status_check",
                    fingerprint_match=True,
                    signature_valid=True,
                )

            return _build_state(
                payload,
                ok=False,
                allows_runtime=False,
                reason=f"Remote license validation is unavailable and the offline grace period has expired. {exc}",
                source="offline_grace_expired",
                fingerprint_match=True,
                signature_valid=True,
            )

    if status not in LICENSE_STATUSES_ALLOWING_RUNTIME:
        return _build_state(
            payload,
            ok=False,
            allows_runtime=False,
            reason=str(payload.get("disable_reason") or f"License status '{status}' does not allow this deployment to run."),
            source="local_status_check",
            fingerprint_match=True,
            signature_valid=True,
        )

    return _build_state(
        payload,
        ok=True,
        allows_runtime=True,
        reason="Local bootstrap license is active.",
        source="local_bootstrap" if not payload.get("last_remote_check_at") else "cached_active_license",
        fingerprint_match=True,
        signature_valid=True,
    )


def get_license_state(force_refresh: bool = False) -> LicenseState:
    return refresh_license_state(force=force_refresh)


def get_license_status_payload(force_refresh: bool = False) -> dict[str, Any]:
    state = get_license_state(force_refresh=force_refresh)
    return {"ok": state.ok, "app": APP_NAME, "version": APP_VERSION, "license": state.to_dict()}


def _print_status() -> int:
    print(json.dumps(get_license_status_payload(force_refresh=True), indent=2))
    return 0


def _print_bootstrap() -> int:
    payload = bootstrap_license_if_missing()
    print(json.dumps(payload, indent=2))
    return 0


def _print_activate(bootstrap_path: Path) -> int:
    payload = activate_from_bootstrap(bootstrap_path)
    print(json.dumps(payload, indent=2))
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Herra private deployment licensing tools")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("bootstrap", help="Create the local bootstrap license if it is missing")
    subparsers.add_parser("status", help="Show the current license evaluation result")
    activate_parser = subparsers.add_parser("activate", help="Activate this deployment from deployment_bootstrap.json if needed")
    activate_parser.add_argument("--bootstrap-path", default=str(DEFAULT_BOOTSTRAP_PATH), help="Path to deployment_bootstrap.json")
    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    if args.command == "bootstrap":
        return _print_bootstrap()
    if args.command == "status":
        return _print_status()
    if args.command == "activate":
        return _print_activate(Path(args.bootstrap_path))
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())