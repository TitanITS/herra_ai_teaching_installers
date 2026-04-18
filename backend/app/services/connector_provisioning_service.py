from __future__ import annotations

from typing import Any, Dict, List

from app.core.config import settings
from app.core.exceptions import bad_request_exception, not_found_exception
from app.services.deployment_service import DEV_DEPLOYMENTS, get_customer_deployment
from app.services.herra_bridge_service import create_herra_bootstrap_token_or_raise

DEV_CONNECTOR_RELEASES: Dict[int, Dict[str, Any]] = {
    101: {
        "id": 101,
        "release_code": "herra-connector-windows-x64",
        "name": "Herra Secure Network Connector for Windows",
        "operating_system": "windows",
        "architecture": "x64",
        "version": "1.0.0",
        "filename": "herra-connector-1.0.0-windows-x64.zip",
        "checksum_sha256": "9e4cb5fe0f8a7f9b4f4b3f9010a8c0e2e7e7b0f2f7a6d9c82e1328c3f11a1010",
        "install_notes": "Run the Windows installer package on the system that will host the Secure Network Connector.",
        "is_active": True,
        "is_latest": True,
        "released_at": "2026-04-12T12:00:00+00:00",
    },
    102: {
        "id": 102,
        "release_code": "herra-connector-macos-arm64",
        "name": "Herra Secure Network Connector for macOS",
        "operating_system": "macos",
        "architecture": "arm64",
        "version": "1.0.0",
        "filename": "herra-connector-1.0.0-macos-arm64.zip",
        "checksum_sha256": "0b1fd7a4d2c8f6027a23d45a82e23c1d09fcb8f4ffb8f5169e1a1dc2471bc202",
        "install_notes": "Use this build for Apple Silicon Macs that will host the Secure Network Connector.",
        "is_active": True,
        "is_latest": True,
        "released_at": "2026-04-12T12:00:00+00:00",
    },
    103: {
        "id": 103,
        "release_code": "herra-connector-macos-x64",
        "name": "Herra Secure Network Connector for macOS",
        "operating_system": "macos",
        "architecture": "x64",
        "version": "1.0.0",
        "filename": "herra-connector-1.0.0-macos-x64.zip",
        "checksum_sha256": "6d69723f28dbf7957865ad86d5f4fd517dcbf32ac7d17b8a2f3c8ce5f28dc303",
        "install_notes": "Use this build for Intel-based Macs that will host the Secure Network Connector.",
        "is_active": True,
        "is_latest": True,
        "released_at": "2026-04-12T12:00:00+00:00",
    },
    104: {
        "id": 104,
        "release_code": "herra-connector-linux-x64",
        "name": "Herra Secure Network Connector for Linux",
        "operating_system": "linux",
        "architecture": "x64",
        "version": "1.0.0",
        "filename": "herra-connector-1.0.0-linux-x64.tar.gz",
        "checksum_sha256": "4df4d8f0ab4872c62c6ed6b9d5f7802254cf99584e47253cf4f0f9d8896de404",
        "install_notes": "Use this build on supported x64 Linux hosts that will run the Secure Network Connector service.",
        "is_active": True,
        "is_latest": True,
        "released_at": "2026-04-12T12:00:00+00:00",
    },
}

DEV_DEPLOYMENT_CONNECTOR_SLOTS: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {
            "slot_id": 1001,
            "deployment_id": 1,
            "connector_name": "Primary Secure Network Connector",
            "site_label": "Primary Site",
            "status": "ready_for_install",
            "included_in_plan": True,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        },
        {
            "slot_id": 1002,
            "deployment_id": 1,
            "connector_name": "Additional Secure Network Connector",
            "site_label": "Secondary Site",
            "status": "available_add_on",
            "included_in_plan": False,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        },
    ],
    3: [
        {
            "slot_id": 3001,
            "deployment_id": 3,
            "connector_name": "Primary Secure Network Connector",
            "site_label": "Main Production Network",
            "status": "ready_for_install",
            "included_in_plan": True,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        }
    ],
    6: [
        {
            "slot_id": 6001,
            "deployment_id": 6,
            "connector_name": "Primary Secure Network Connector",
            "site_label": "Factory Network",
            "status": "ready_for_install",
            "included_in_plan": True,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        }
    ],
    7: [
        {
            "slot_id": 7001,
            "deployment_id": 7,
            "connector_name": "Primary Secure Network Connector",
            "site_label": "Corporate Network",
            "status": "ready_for_install",
            "included_in_plan": True,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        },
        {
            "slot_id": 7002,
            "deployment_id": 7,
            "connector_name": "Additional Secure Network Connector",
            "site_label": "Warehouse Network",
            "status": "planned",
            "included_in_plan": False,
            "operating_system": None,
            "architecture": None,
            "release_id": None,
            "bootstrap_status": "not_started",
        },
    ],
}

DEV_PROVISIONING_BOOTSTRAP_HISTORY: Dict[int, List[Dict[str, Any]]] = {}


def _get_deployment_or_raise(deployment_id: int) -> Dict[str, Any]:
    deployment = DEV_DEPLOYMENTS.get(deployment_id)
    if deployment is None:
        raise not_found_exception("Deployment was not found.")
    return deployment


def _get_release_or_raise(release_id: int) -> Dict[str, Any]:
    release = DEV_CONNECTOR_RELEASES.get(release_id)
    if release is None:
        raise not_found_exception("Connector release was not found.")
    if not release["is_active"]:
        raise bad_request_exception("Connector release is not active.")
    return release


def _get_slot_or_raise(deployment_id: int, slot_id: int) -> Dict[str, Any]:
    slots = DEV_DEPLOYMENT_CONNECTOR_SLOTS.get(deployment_id, [])
    for slot in slots:
        if slot["slot_id"] == slot_id:
            return slot
    raise not_found_exception("Connector slot was not found for this deployment.")


def _build_download_url(filename: str) -> str:
    return f"{settings.CONNECTOR_DOWNLOAD_BASE_URL.rstrip('/')}/{filename}"


def _build_release_summary(release: Dict[str, Any]) -> Dict[str, Any]:
    return {
        **release,
        "download_url": _build_download_url(release["filename"]),
    }


def list_connector_releases() -> List[Dict[str, Any]]:
    releases = [_build_release_summary(item.copy()) for item in DEV_CONNECTOR_RELEASES.values() if item["is_active"]]
    return sorted(releases, key=lambda item: (item["operating_system"], item["architecture"], item["name"], item["id"]))


def _get_latest_bootstrap_for_slot(slot_id: int) -> Dict[str, Any] | None:
    items = DEV_PROVISIONING_BOOTSTRAP_HISTORY.get(slot_id, [])
    if not items:
        return None
    return sorted(items, key=lambda item: item["created_at"], reverse=True)[0]


def _build_slot_summary(slot: Dict[str, Any]) -> Dict[str, Any]:
    release = None
    if slot.get("release_id"):
        release = _get_release_or_raise(int(slot["release_id"]))

    latest_bootstrap = _get_latest_bootstrap_for_slot(int(slot["slot_id"]))

    return {
        "slot_id": slot["slot_id"],
        "deployment_id": slot["deployment_id"],
        "connector_name": slot["connector_name"],
        "site_label": slot["site_label"],
        "status": slot["status"],
        "included_in_plan": bool(slot["included_in_plan"]),
        "operating_system": slot.get("operating_system"),
        "architecture": slot.get("architecture"),
        "release_id": slot.get("release_id"),
        "release_name": release["name"] if release else None,
        "release_version": release["version"] if release else None,
        "installer_filename": release["filename"] if release else None,
        "installer_download_url": _build_download_url(release["filename"]) if release else None,
        "install_notes": release["install_notes"] if release else None,
        "bootstrap_status": latest_bootstrap["status"] if latest_bootstrap else slot.get("bootstrap_status", "not_started"),
        "last_bootstrap_created_at": latest_bootstrap["created_at"] if latest_bootstrap else None,
        "last_bootstrap_expires_at": latest_bootstrap["expires_at"] if latest_bootstrap else None,
        "last_bootstrap_used": bool(latest_bootstrap["used"]) if latest_bootstrap else False,
        "last_bootstrap_used_at": latest_bootstrap["used_at"] if latest_bootstrap else None,
        "last_bootstrap_used_by_name": latest_bootstrap["used_by_name"] if latest_bootstrap else None,
    }


def _build_provisioning_summary(deployment: Dict[str, Any]) -> Dict[str, Any]:
    slots = DEV_DEPLOYMENT_CONNECTOR_SLOTS.get(int(deployment["id"]), [])
    included_connector_count = sum(1 for slot in slots if slot["included_in_plan"])
    additional_connector_count = sum(1 for slot in slots if not slot["included_in_plan"])

    return {
        "deployment_id": deployment["id"],
        "deployment_name": deployment["name"],
        "deployment_code": deployment["deployment_code"],
        "customer_account_id": deployment["customer_account_id"],
        "customer_account_name": deployment.get("customer_account_name", ""),
        "included_connector_count": included_connector_count,
        "additional_connector_count": additional_connector_count,
        "total_connector_count": len(slots),
        "connector_releases": list_connector_releases(),
        "connector_slots": [_build_slot_summary(slot) for slot in slots],
    }


def get_customer_deployment_provisioning(current_user: Dict[str, Any]) -> Dict[str, Any]:
    deployment = get_customer_deployment(current_user)
    summary = _build_provisioning_summary(deployment)
    summary.pop("customer_account_id", None)
    summary.pop("customer_account_name", None)
    return summary


def get_platform_deployment_provisioning(deployment_id: int) -> Dict[str, Any]:
    deployment = _get_deployment_or_raise(deployment_id)
    return _build_provisioning_summary(deployment)


def _sanitize_bootstrap_minutes(value: int) -> int:
    return max(5, min(int(value), int(settings.CONNECTOR_MAX_BOOTSTRAP_EXPIRES_MINUTES)))


def _create_bootstrap_record(
    *,
    deployment: Dict[str, Any],
    slot: Dict[str, Any],
    release: Dict[str, Any],
    expires_minutes: int,
    requested_by: Dict[str, Any],
    connector_name_override: str | None,
    site_label_override: str | None,
) -> Dict[str, Any]:
    connector_name = (connector_name_override or "").strip() or slot["connector_name"]
    site_label = (site_label_override or "").strip() or slot["site_label"]
    expires_minutes = _sanitize_bootstrap_minutes(expires_minutes)

    label = f"{deployment['deployment_code']} | {site_label} | {release['operating_system']} {release['architecture']}"
    herra_body = {
        "label": label,
        "expires_minutes": expires_minutes,
        "deployment_id": deployment["id"],
        "deployment_code": deployment["deployment_code"],
        "customer_account_id": deployment["customer_account_id"],
        "customer_account_name": deployment.get("customer_account_name", ""),
        "titan_connector_slot_id": slot["slot_id"],
        "connector_name": connector_name,
        "site_label": site_label,
        "operating_system": release["operating_system"],
        "architecture": release["architecture"],
        "release_id": release["id"],
        "release_version": release["version"],
        "requested_by_email": requested_by.get("email") or "",
    }
    bootstrap = create_herra_bootstrap_token_or_raise(body=herra_body)

    slot["connector_name"] = connector_name
    slot["site_label"] = site_label
    slot["operating_system"] = release["operating_system"]
    slot["architecture"] = release["architecture"]
    slot["release_id"] = release["id"]
    slot["bootstrap_status"] = "issued"
    slot["status"] = "bootstrap_issued"

    history_item = {
        "slot_id": slot["slot_id"],
        "release_id": release["id"],
        "bootstrap_id": bootstrap["id"],
        "bootstrap_token": bootstrap["token"],
        "label": bootstrap["label"],
        "created_at": bootstrap["created_at"],
        "expires_at": bootstrap["expires_at"],
        "used": bool(bootstrap.get("used", False)),
        "used_at": bootstrap.get("used_at"),
        "used_by_name": bootstrap.get("used_by_name"),
        "status": "issued",
    }
    DEV_PROVISIONING_BOOTSTRAP_HISTORY.setdefault(int(slot["slot_id"]), []).append(history_item)

    return {
        "slot_id": slot["slot_id"],
        "release_id": release["id"],
        "bootstrap_id": bootstrap["id"],
        "bootstrap_token": bootstrap["token"],
        "bootstrap_label": bootstrap["label"],
        "bootstrap_expires_at": bootstrap["expires_at"],
        "connector_name": connector_name,
        "operating_system": release["operating_system"],
        "architecture": release["architecture"],
        "installer_filename": release["filename"],
        "installer_download_url": _build_download_url(release["filename"]),
        "install_notes": release["install_notes"],
        "message": "Connector bootstrap token created successfully.",
    }


def create_customer_deployment_bootstrap(current_user: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
    deployment = get_customer_deployment(current_user)
    slot = _get_slot_or_raise(int(deployment["id"]), int(payload["slot_id"]))
    release = _get_release_or_raise(int(payload["release_id"]))
    return _create_bootstrap_record(
        deployment=deployment,
        slot=slot,
        release=release,
        expires_minutes=int(payload.get("expires_minutes") or settings.CONNECTOR_DEFAULT_BOOTSTRAP_EXPIRES_MINUTES),
        requested_by=current_user,
        connector_name_override=payload.get("connector_name"),
        site_label_override=payload.get("site_label"),
    )


def create_platform_deployment_bootstrap(
    deployment_id: int,
    payload: Dict[str, Any],
    current_user: Dict[str, Any],
) -> Dict[str, Any]:
    deployment = _get_deployment_or_raise(deployment_id)
    slot = _get_slot_or_raise(int(deployment_id), int(payload["slot_id"]))
    release = _get_release_or_raise(int(payload["release_id"]))
    return _create_bootstrap_record(
        deployment=deployment,
        slot=slot,
        release=release,
        expires_minutes=int(payload.get("expires_minutes") or settings.CONNECTOR_DEFAULT_BOOTSTRAP_EXPIRES_MINUTES),
        requested_by=current_user,
        connector_name_override=payload.get("connector_name"),
        site_label_override=payload.get("site_label"),
    )