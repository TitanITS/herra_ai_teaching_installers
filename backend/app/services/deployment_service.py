from typing import Any, Dict, List
from urllib.parse import urlencode

from app.core.config import settings
from app.core.exceptions import not_found_exception

DEV_DEPLOYMENTS: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "customer_account_id": 1,
        "customer_account_name": "Demo Customer",
        "name": "Demo Customer Production",
        "deployment_code": "herra-demo-prod",
        "status": "active",
        "version": "Herra v1.0.0",
        "environment_type": "production",
        "region": "us-east",
        "launch_url": "https://herra.demo.customer/launch",
        "health_status": "healthy",
        "last_seen_at": "2026-03-20T18:30:00+00:00",
    },
    2: {
        "id": 2,
        "customer_account_id": 1,
        "customer_account_name": "Demo Customer",
        "name": "Demo Customer Staging",
        "deployment_code": "herra-demo-stage",
        "status": "active",
        "version": "Herra v1.0.0-rc2",
        "environment_type": "staging",
        "region": "us-east",
        "launch_url": "https://herra.demo.customer/staging-launch",
        "health_status": "warning",
        "last_seen_at": "2026-03-20T17:55:00+00:00",
    },
    3: {
        "id": 3,
        "customer_account_id": 2,
        "customer_account_name": "Northwind Health Group",
        "name": "Northwind Production",
        "deployment_code": "herra-northwind-prod",
        "status": "onboarding",
        "version": "Herra v1.0.0",
        "environment_type": "production",
        "region": "us-central",
        "launch_url": "https://herra.northwindhealth.customer/launch",
        "health_status": "warning",
        "last_seen_at": "2026-03-20T16:42:00+00:00",
    },
    4: {
        "id": 4,
        "customer_account_id": 2,
        "customer_account_name": "Northwind Health Group",
        "name": "Northwind Training",
        "deployment_code": "herra-northwind-training",
        "status": "planned",
        "version": "Herra v1.0.0",
        "environment_type": "training",
        "region": "us-central",
        "launch_url": "https://herra.northwindhealth.customer/training-launch",
        "health_status": "healthy",
        "last_seen_at": "2026-03-18T14:10:00+00:00",
    },
    5: {
        "id": 5,
        "customer_account_id": 3,
        "customer_account_name": "Red Canyon Logistics",
        "name": "Red Canyon Pilot",
        "deployment_code": "herra-redcanyon-pilot",
        "status": "proposal",
        "version": "Herra v1.0.0",
        "environment_type": "pilot",
        "region": "us-west",
        "launch_url": "https://herra.redcanyon.customer/pilot-launch",
        "health_status": "healthy",
        "last_seen_at": "2026-03-17T13:20:00+00:00",
    },
    6: {
        "id": 6,
        "customer_account_id": 4,
        "customer_account_name": "Blue Ridge Manufacturing",
        "name": "Blue Ridge Onboarding",
        "deployment_code": "herra-blueridge-onboarding",
        "status": "onboarding",
        "version": "Herra v1.0.0",
        "environment_type": "production",
        "region": "us-east",
        "launch_url": "https://herra.blueridge.customer/launch",
        "health_status": "warning",
        "last_seen_at": "2026-03-20T15:35:00+00:00",
    },
    7: {
        "id": 7,
        "customer_account_id": 5,
        "customer_account_name": "Redstone Industrial Group",
        "name": "Redstone Production",
        "deployment_code": "herra-redstone-prod",
        "status": "onboarding",
        "version": "Herra v1.0.0",
        "environment_type": "production",
        "region": "us-east",
        "launch_url": "https://herra.redstone.customer/launch",
        "health_status": "healthy",
        "last_seen_at": "2026-03-20T19:05:00+00:00",
    },
}

DEV_DEPLOYMENT_HEALTH: Dict[int, Dict[str, Any]] = {
    1: {
        "health_status": "healthy",
        "cpu_percent": 34,
        "memory_percent": 57,
        "last_reported_at": "2026-03-20T18:30:00+00:00",
    },
    2: {
        "health_status": "warning",
        "cpu_percent": 71,
        "memory_percent": 82,
        "last_reported_at": "2026-03-20T17:55:00+00:00",
    },
    3: {
        "health_status": "warning",
        "cpu_percent": 63,
        "memory_percent": 68,
        "last_reported_at": "2026-03-20T16:42:00+00:00",
    },
    4: {
        "health_status": "healthy",
        "cpu_percent": 22,
        "memory_percent": 39,
        "last_reported_at": "2026-03-18T14:10:00+00:00",
    },
    5: {
        "health_status": "healthy",
        "cpu_percent": 19,
        "memory_percent": 33,
        "last_reported_at": "2026-03-17T13:20:00+00:00",
    },
    6: {
        "health_status": "warning",
        "cpu_percent": 54,
        "memory_percent": 76,
        "last_reported_at": "2026-03-20T15:35:00+00:00",
    },
    7: {
        "health_status": "healthy",
        "cpu_percent": 28,
        "memory_percent": 44,
        "last_reported_at": "2026-03-20T19:05:00+00:00",
    },
}

DEV_DEPLOYMENT_EVENTS: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {
            "id": 1,
            "event_type": "deployment_started",
            "severity": "info",
            "message": "Production deployment started successfully.",
            "created_at": "2026-03-20T17:00:00+00:00",
        },
        {
            "id": 2,
            "event_type": "health_check",
            "severity": "info",
            "message": "Production health check passed.",
            "created_at": "2026-03-20T18:00:00+00:00",
        },
    ],
    2: [
        {
            "id": 3,
            "event_type": "resource_warning",
            "severity": "warning",
            "message": "Staging deployment memory usage exceeded warning threshold.",
            "created_at": "2026-03-20T17:40:00+00:00",
        },
        {
            "id": 4,
            "event_type": "health_check",
            "severity": "warning",
            "message": "Staging deployment remains reachable but needs review.",
            "created_at": "2026-03-20T17:55:00+00:00",
        },
    ],
    3: [
        {
            "id": 5,
            "event_type": "onboarding_step",
            "severity": "info",
            "message": "Northwind production deployment entered onboarding validation.",
            "created_at": "2026-03-20T15:20:00+00:00",
        },
        {
            "id": 6,
            "event_type": "connector_dependency",
            "severity": "warning",
            "message": "Northwind deployment is waiting on Secure Network Connector activation.",
            "created_at": "2026-03-20T16:10:00+00:00",
        },
    ],
    4: [
        {
            "id": 7,
            "event_type": "deployment_planned",
            "severity": "info",
            "message": "Training deployment is scheduled for rollout.",
            "created_at": "2026-03-18T14:10:00+00:00",
        }
    ],
    5: [
        {
            "id": 8,
            "event_type": "proposal_created",
            "severity": "info",
            "message": "Pilot deployment proposal generated.",
            "created_at": "2026-03-17T13:20:00+00:00",
        }
    ],
    6: [
        {
            "id": 9,
            "event_type": "connector_dependency",
            "severity": "warning",
            "message": "Onboarding deployment is blocked pending connector installer validation.",
            "created_at": "2026-03-20T15:35:00+00:00",
        }
    ],
    7: [
        {
            "id": 10,
            "event_type": "deployment_started",
            "severity": "info",
            "message": "Redstone production deployment entered final onboarding.",
            "created_at": "2026-03-20T19:05:00+00:00",
        }
    ],
}


def _get_deployment_or_raise(deployment_id: int) -> Dict[str, Any]:
    deployment = DEV_DEPLOYMENTS.get(deployment_id)
    if deployment is None:
        raise not_found_exception("Deployment was not found.")
    return deployment


def _normalize_base_url(value: str) -> str:
    return value.rstrip("/")


def _build_herra_launch_url(deployment: Dict[str, Any], current_user: Dict[str, Any]) -> str:
    base_url = _normalize_base_url(settings.HERRA_FRONTEND_BASE_URL)
    query = urlencode(
        {
            "source": "titan",
            "tab": settings.HERRA_FRONTEND_DEFAULT_TAB,
            "deployment_id": deployment["id"],
            "deployment_code": deployment["deployment_code"],
            "deployment_name": deployment["name"],
            "environment_type": deployment["environment_type"],
            "region": deployment["region"],
            "customer_account_id": deployment["customer_account_id"],
            "customer_account_name": deployment.get("customer_account_name", ""),
            "customer_user_email": current_user.get("email", ""),
            "customer_user_name": current_user.get("full_name", "") or current_user.get("name", ""),
        }
    )
    return f"{base_url}/?{query}"


def get_customer_deployment(current_user: Dict[str, Any]) -> Dict[str, Any]:
    customer_deployments = [
        deployment
        for deployment in DEV_DEPLOYMENTS.values()
        if deployment["customer_account_id"] == current_user["customer_account_id"]
    ]

    if not customer_deployments:
        raise not_found_exception("Deployment was not found.")

    selected = sorted(customer_deployments, key=lambda item: item["id"])[0]
    return selected.copy()


def get_customer_deployment_health(current_user: Dict[str, Any]) -> Dict[str, Any]:
    deployment = get_customer_deployment(current_user)
    return DEV_DEPLOYMENT_HEALTH[deployment["id"]].copy()


def get_customer_deployment_events(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    deployment = get_customer_deployment(current_user)
    return [event.copy() for event in DEV_DEPLOYMENT_EVENTS.get(deployment["id"], [])]


def launch_customer_deployment(current_user: Dict[str, Any]) -> Dict[str, str]:
    deployment = get_customer_deployment(current_user)
    return {
        "launch_url": _build_herra_launch_url(deployment, current_user),
        "message": "Herra launch URL retrieved successfully.",
    }


def list_platform_deployments() -> List[Dict[str, Any]]:
    deployments = [deployment.copy() for deployment in DEV_DEPLOYMENTS.values()]
    return sorted(
        deployments,
        key=lambda item: (
            item["customer_account_name"].lower(),
            item["name"].lower(),
            item["id"],
        ),
    )


def get_platform_deployment_detail(deployment_id: int) -> Dict[str, Any]:
    deployment = _get_deployment_or_raise(deployment_id).copy()
    deployment["events"] = [event.copy() for event in DEV_DEPLOYMENT_EVENTS.get(deployment_id, [])]
    return deployment


def get_platform_deployment_health(deployment_id: int) -> Dict[str, Any]:
    _ = _get_deployment_or_raise(deployment_id)
    return DEV_DEPLOYMENT_HEALTH[deployment_id].copy()


def get_platform_deployment_events(deployment_id: int) -> List[Dict[str, Any]]:
    _ = _get_deployment_or_raise(deployment_id)
    return [event.copy() for event in DEV_DEPLOYMENT_EVENTS.get(deployment_id, [])]