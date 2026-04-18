from typing import Any, Dict, List

from app.core.exceptions import not_found_exception
from app.services.connector_service import DEV_CONNECTORS
from app.services.customer_account_service import DEV_CUSTOMER_ACCOUNTS, DEV_CUSTOMER_CONTACTS
from app.services.deployment_service import DEV_DEPLOYMENTS


def _get_customer_or_raise(customer_id: int) -> Dict[str, Any]:
    customer = DEV_CUSTOMER_ACCOUNTS.get(customer_id)
    if customer is None:
        raise not_found_exception("Customer account was not found.")
    return customer


def list_platform_technician_customers() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    for customer in DEV_CUSTOMER_ACCOUNTS.values():
        customer_id = customer["id"]
        deployment_count = len(
            [deployment for deployment in DEV_DEPLOYMENTS.values() if deployment["customer_account_id"] == customer_id]
        )
        connector_count = len(
            [connector for connector in DEV_CONNECTORS.values() if connector["customer_account_id"] == customer_id]
        )

        items.append(
            {
                "id": customer_id,
                "name": customer["name"],
                "status": customer["status"],
                "primary_contact_name": customer["primary_contact_name"],
                "primary_contact_email": customer["primary_contact_email"],
                "deployment_count": deployment_count,
                "connector_count": connector_count,
            }
        )

    return sorted(items, key=lambda item: item["name"].lower())


def get_platform_technician_workspace_detail(customer_id: int) -> Dict[str, Any]:
    customer = _get_customer_or_raise(customer_id)

    deployments = [
        {
            "id": deployment["id"],
            "name": deployment["name"],
            "deployment_code": deployment["deployment_code"],
            "status": deployment["status"],
            "health_status": deployment["health_status"],
            "environment_type": deployment["environment_type"],
            "region": deployment["region"],
            "version": deployment["version"],
            "launch_url": deployment["launch_url"],
            "last_seen_at": deployment["last_seen_at"],
        }
        for deployment in DEV_DEPLOYMENTS.values()
        if deployment["customer_account_id"] == customer_id
    ]

    connectors = [
        {
            "id": connector["id"],
            "name": connector["name"],
            "connector_type": connector["connector_type"],
            "status": connector["status"],
            "health_status": connector["health_status"],
            "sync_mode": connector["sync_mode"],
            "auth_mode": connector["auth_mode"],
            "target_system": connector["target_system"],
            "last_sync_at": connector["last_sync_at"],
        }
        for connector in DEV_CONNECTORS.values()
        if connector["customer_account_id"] == customer_id
    ]

    deployments = sorted(deployments, key=lambda item: (item["name"].lower(), item["id"]))
    connectors = sorted(connectors, key=lambda item: (item["name"].lower(), item["id"]))

    return {
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "customer_status": customer["status"],
        "timezone": customer["timezone"],
        "primary_contact_name": customer["primary_contact_name"],
        "primary_contact_email": customer["primary_contact_email"],
        "billing_email": customer["billing_email"],
        "notes": customer.get("notes", ""),
        "contacts": [contact.copy() for contact in DEV_CUSTOMER_CONTACTS.get(customer_id, [])],
        "deployments": deployments,
        "connectors": connectors,
    }