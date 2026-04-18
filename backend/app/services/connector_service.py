from typing import Any, Dict, List

from app.core.exceptions import bad_request_exception, not_found_exception

DEV_CONNECTORS: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "customer_account_id": 1,
        "customer_account_name": "Demo Customer",
        "deployment_id": 1,
        "connector_code": "microsoft-365",
        "name": "Microsoft 365 Connector",
        "connector_type": "microsoft_365",
        "status": "active",
        "version": "1.0.0",
        "health_status": "healthy",
        "last_sync_at": "2026-03-20T18:20:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "oauth",
        "target_system": "Microsoft 365 Tenant",
        "available_actions": ["sync_now", "recheck_health", "validate"],
    },
    2: {
        "id": 2,
        "customer_account_id": 1,
        "customer_account_name": "Demo Customer",
        "deployment_id": 1,
        "connector_code": "sharepoint",
        "name": "SharePoint Connector",
        "connector_type": "sharepoint",
        "status": "active",
        "version": "1.0.0",
        "health_status": "warning",
        "last_sync_at": "2026-03-20T17:50:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "service_account",
        "target_system": "SharePoint Online",
        "available_actions": ["sync_now", "recheck_health", "validate"],
    },
    3: {
        "id": 3,
        "customer_account_id": 2,
        "customer_account_name": "Northwind Health Group",
        "deployment_id": 3,
        "connector_code": "sharepoint",
        "name": "SharePoint Connector",
        "connector_type": "sharepoint",
        "status": "planned",
        "version": "1.0.0",
        "health_status": "healthy",
        "last_sync_at": "2026-03-18T13:00:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "service_account",
        "target_system": "SharePoint Online",
        "available_actions": ["validate"],
    },
    4: {
        "id": 4,
        "customer_account_id": 2,
        "customer_account_name": "Northwind Health Group",
        "deployment_id": 3,
        "connector_code": "active-directory",
        "name": "Active Directory Connector",
        "connector_type": "active_directory",
        "status": "onboarding",
        "version": "1.0.0",
        "health_status": "warning",
        "last_sync_at": "2026-03-20T15:10:00+00:00",
        "sync_mode": "manual",
        "auth_mode": "service_account",
        "target_system": "Windows Active Directory",
        "available_actions": ["validate", "recheck_health"],
    },
    5: {
        "id": 5,
        "customer_account_id": 3,
        "customer_account_name": "Red Canyon Logistics",
        "deployment_id": 5,
        "connector_code": "google-workspace",
        "name": "Google Workspace Connector",
        "connector_type": "google_workspace",
        "status": "proposal",
        "version": "1.0.0",
        "health_status": "healthy",
        "last_sync_at": "2026-03-17T12:45:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "oauth",
        "target_system": "Google Workspace",
        "available_actions": ["validate"],
    },
    6: {
        "id": 6,
        "customer_account_id": 4,
        "customer_account_name": "Blue Ridge Manufacturing",
        "deployment_id": 6,
        "connector_code": "sql-server",
        "name": "SQL Server Connector",
        "connector_type": "sql_server",
        "status": "onboarding",
        "version": "1.0.0",
        "health_status": "warning",
        "last_sync_at": "2026-03-20T14:55:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "service_account",
        "target_system": "SQL Server Cluster",
        "available_actions": ["sync_now", "validate", "recheck_health"],
    },
    7: {
        "id": 7,
        "customer_account_id": 5,
        "customer_account_name": "Redstone Industrial Group",
        "deployment_id": 7,
        "connector_code": "microsoft-365",
        "name": "Microsoft 365 Connector",
        "connector_type": "microsoft_365",
        "status": "onboarding",
        "version": "1.0.0",
        "health_status": "healthy",
        "last_sync_at": "2026-03-20T19:00:00+00:00",
        "sync_mode": "scheduled",
        "auth_mode": "oauth",
        "target_system": "Microsoft 365 Tenant",
        "available_actions": ["sync_now", "validate", "recheck_health"],
    },
}

DEV_CONNECTOR_HEALTH: Dict[int, Dict[str, Any]] = {
    1: {
        "health_status": "healthy",
        "last_reported_at": "2026-03-20T18:20:00+00:00",
        "success_rate_percent": 99,
        "queue_depth": 0,
    },
    2: {
        "health_status": "warning",
        "last_reported_at": "2026-03-20T17:50:00+00:00",
        "success_rate_percent": 91,
        "queue_depth": 4,
    },
    3: {
        "health_status": "healthy",
        "last_reported_at": "2026-03-18T13:00:00+00:00",
        "success_rate_percent": 100,
        "queue_depth": 0,
    },
    4: {
        "health_status": "warning",
        "last_reported_at": "2026-03-20T15:10:00+00:00",
        "success_rate_percent": 87,
        "queue_depth": 2,
    },
    5: {
        "health_status": "healthy",
        "last_reported_at": "2026-03-17T12:45:00+00:00",
        "success_rate_percent": 100,
        "queue_depth": 0,
    },
    6: {
        "health_status": "warning",
        "last_reported_at": "2026-03-20T14:55:00+00:00",
        "success_rate_percent": 84,
        "queue_depth": 3,
    },
    7: {
        "health_status": "healthy",
        "last_reported_at": "2026-03-20T19:00:00+00:00",
        "success_rate_percent": 98,
        "queue_depth": 0,
    },
}

DEV_CONNECTOR_JOBS: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {
            "id": 1,
            "job_type": "sync",
            "status": "completed",
            "result_summary": "Microsoft 365 sync completed successfully.",
            "created_at": "2026-03-20T18:20:00+00:00",
        }
    ],
    2: [
        {
            "id": 2,
            "job_type": "sync",
            "status": "warning",
            "result_summary": "SharePoint sync completed with skipped items.",
            "created_at": "2026-03-20T17:50:00+00:00",
        }
    ],
    3: [
        {
            "id": 3,
            "job_type": "validate",
            "status": "completed",
            "result_summary": "Connector planned and validation checks passed.",
            "created_at": "2026-03-18T13:00:00+00:00",
        }
    ],
    4: [
        {
            "id": 4,
            "job_type": "validate",
            "status": "warning",
            "result_summary": "Active Directory permissions still need follow-up.",
            "created_at": "2026-03-20T15:10:00+00:00",
        }
    ],
    5: [
        {
            "id": 5,
            "job_type": "proposal_scope",
            "status": "completed",
            "result_summary": "Connector scope saved to proposal workflow.",
            "created_at": "2026-03-17T12:45:00+00:00",
        }
    ],
    6: [
        {
            "id": 6,
            "job_type": "sync",
            "status": "warning",
            "result_summary": "Initial SQL sync hit permission-related warnings.",
            "created_at": "2026-03-20T14:55:00+00:00",
        }
    ],
    7: [
        {
            "id": 7,
            "job_type": "sync",
            "status": "completed",
            "result_summary": "Microsoft 365 connector initial sync completed successfully.",
            "created_at": "2026-03-20T19:00:00+00:00",
        }
    ],
}

DEV_CONNECTOR_EVENTS: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {
            "id": 1,
            "event_type": "sync_completed",
            "severity": "info",
            "message": "Microsoft 365 sync completed successfully.",
            "created_at": "2026-03-20T18:20:00+00:00",
        },
        {
            "id": 2,
            "event_type": "auth_validated",
            "severity": "info",
            "message": "OAuth token validation passed.",
            "created_at": "2026-03-20T17:40:00+00:00",
        },
    ],
    2: [
        {
            "id": 3,
            "event_type": "sync_warning",
            "severity": "warning",
            "message": "SharePoint connector sync completed with skipped items.",
            "created_at": "2026-03-20T17:50:00+00:00",
        }
    ],
    3: [
        {
            "id": 4,
            "event_type": "connector_planned",
            "severity": "info",
            "message": "Connector reserved for onboarding sequence.",
            "created_at": "2026-03-18T13:00:00+00:00",
        }
    ],
    4: [
        {
            "id": 5,
            "event_type": "credential_review",
            "severity": "warning",
            "message": "Active Directory service account permissions still under validation.",
            "created_at": "2026-03-20T15:10:00+00:00",
        }
    ],
    5: [
        {
            "id": 6,
            "event_type": "proposal_scope",
            "severity": "info",
            "message": "Connector scope attached to sales proposal.",
            "created_at": "2026-03-17T12:45:00+00:00",
        }
    ],
    6: [
        {
            "id": 7,
            "event_type": "onboarding_step",
            "severity": "warning",
            "message": "Initial SQL permissions require follow-up before first full sync.",
            "created_at": "2026-03-20T14:55:00+00:00",
        }
    ],
    7: [
        {
            "id": 8,
            "event_type": "sync_completed",
            "severity": "info",
            "message": "Microsoft 365 connector initial sync completed successfully.",
            "created_at": "2026-03-20T19:00:00+00:00",
        }
    ],
}


def _get_connector_or_raise(connector_id: int) -> Dict[str, Any]:
    connector = DEV_CONNECTORS.get(connector_id)
    if connector is None:
        raise not_found_exception("Connector was not found.")
    return connector


def _serialize_customer_connector_list_item(connector: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": connector["id"],
        "deployment_id": connector["deployment_id"],
        "connector_code": connector["connector_code"],
        "name": connector["name"],
        "status": connector["status"],
        "version": connector["version"],
        "health_status": connector["health_status"],
        "last_sync_at": connector["last_sync_at"],
        "connector_type": connector["connector_type"],
        "sync_mode": connector["sync_mode"],
        "auth_mode": connector["auth_mode"],
        "target_system": connector["target_system"],
    }


def _serialize_customer_connector_detail(connector: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": connector["id"],
        "deployment_id": connector["deployment_id"],
        "connector_code": connector["connector_code"],
        "name": connector["name"],
        "status": connector["status"],
        "version": connector["version"],
        "health_status": connector["health_status"],
        "last_sync_at": connector["last_sync_at"],
        "connector_type": connector["connector_type"],
        "sync_mode": connector["sync_mode"],
        "auth_mode": connector["auth_mode"],
        "target_system": connector["target_system"],
        "available_actions": list(connector["available_actions"]),
        "events": [event.copy() for event in DEV_CONNECTOR_EVENTS.get(connector["id"], [])],
    }


def _serialize_platform_connector_list_item(connector: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": connector["id"],
        "customer_account_id": connector["customer_account_id"],
        "customer_account_name": connector["customer_account_name"],
        "deployment_id": connector["deployment_id"],
        "connector_code": connector["connector_code"],
        "name": connector["name"],
        "status": connector["status"],
        "version": connector["version"],
        "health_status": connector["health_status"],
        "last_sync_at": connector["last_sync_at"],
        "connector_type": connector["connector_type"],
        "sync_mode": connector["sync_mode"],
        "auth_mode": connector["auth_mode"],
        "target_system": connector["target_system"],
    }


def _serialize_platform_connector_detail(connector: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": connector["id"],
        "customer_account_id": connector["customer_account_id"],
        "customer_account_name": connector["customer_account_name"],
        "deployment_id": connector["deployment_id"],
        "connector_code": connector["connector_code"],
        "name": connector["name"],
        "status": connector["status"],
        "version": connector["version"],
        "health_status": connector["health_status"],
        "last_sync_at": connector["last_sync_at"],
        "connector_type": connector["connector_type"],
        "sync_mode": connector["sync_mode"],
        "auth_mode": connector["auth_mode"],
        "target_system": connector["target_system"],
        "available_actions": list(connector["available_actions"]),
        "events": [event.copy() for event in DEV_CONNECTOR_EVENTS.get(connector["id"], [])],
    }


def list_customer_connectors(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    connectors = [
        _serialize_customer_connector_list_item(connector)
        for connector in DEV_CONNECTORS.values()
        if connector["customer_account_id"] == current_user["customer_account_id"]
    ]
    return sorted(connectors, key=lambda item: (item["name"].lower(), item["id"]))


def get_customer_connector_detail(current_user: Dict[str, Any], connector_id: int) -> Dict[str, Any]:
    connector = _get_connector_or_raise(connector_id)
    if connector["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Connector was not found.")
    return _serialize_customer_connector_detail(connector)


def get_customer_connector_health(current_user: Dict[str, Any], connector_id: int) -> Dict[str, Any]:
    connector = _get_connector_or_raise(connector_id)
    if connector["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Connector was not found.")
    return DEV_CONNECTOR_HEALTH[connector_id].copy()


def get_customer_connector_jobs(current_user: Dict[str, Any], connector_id: int) -> List[Dict[str, Any]]:
    connector = _get_connector_or_raise(connector_id)
    if connector["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Connector was not found.")
    return [job.copy() for job in DEV_CONNECTOR_JOBS.get(connector_id, [])]


def run_customer_connector_action(current_user: Dict[str, Any], connector_id: int, action_code: str) -> Dict[str, Any]:
    connector = _get_connector_or_raise(connector_id)
    if connector["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Connector was not found.")

    if action_code not in connector["available_actions"]:
        raise bad_request_exception("Requested connector action is not supported.")

    return {
        "message": "Connector action completed successfully.",
        "connector_id": connector_id,
        "action_code": action_code,
        "status": "completed",
    }


def list_platform_connectors() -> List[Dict[str, Any]]:
    connectors = [_serialize_platform_connector_list_item(connector) for connector in DEV_CONNECTORS.values()]
    return sorted(
        connectors,
        key=lambda item: (
            item["customer_account_name"].lower(),
            item["name"].lower(),
            item["id"],
        ),
    )


def get_platform_connector_detail(connector_id: int) -> Dict[str, Any]:
    connector = _get_connector_or_raise(connector_id)
    return _serialize_platform_connector_detail(connector)


def get_platform_connector_health(connector_id: int) -> Dict[str, Any]:
    _ = _get_connector_or_raise(connector_id)
    return DEV_CONNECTOR_HEALTH[connector_id].copy()


def get_platform_connector_jobs(connector_id: int) -> List[Dict[str, Any]]:
    _ = _get_connector_or_raise(connector_id)
    return [job.copy() for job in DEV_CONNECTOR_JOBS.get(connector_id, [])]


def run_platform_connector_action(connector_id: int, action_code: str) -> Dict[str, Any]:
    connector = _get_connector_or_raise(connector_id)

    if action_code not in connector["available_actions"]:
        raise bad_request_exception("Requested connector action is not supported.")

    return {
        "message": "Platform connector action completed successfully.",
        "connector_id": connector_id,
        "action_code": action_code,
        "status": "completed",
    }