from typing import Dict, List, Set

from app.core.permissions import normalize_permissions

CUSTOMER_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "Customer Administrator": [
        "customer_account.view",
        "customer_account.update",
        "customer_users.view",
        "customer_users.create",
        "customer_users.update",
        "customer_users.disable",
        "customer_roles.view",
        "customer_roles.assign",
        "deployment.view",
        "deployment.launch",
        "deployment.view_health",
        "connectors.view",
        "connectors.view_health",
        "connectors.run_action",
        "support_cases.view",
        "support_cases.create",
        "support_cases.update",
        "settings.view",
        "settings.update",
    ],
    "Customer Billing Manager": [
        "customer_account.view",
        "billing.view",
        "billing.manage_contacts",
    ],
    "Customer Deployment Manager": [
        "customer_account.view",
        "deployment.view",
        "deployment.launch",
        "deployment.view_health",
        "connectors.view",
        "connectors.view_health",
    ],
    "Customer Connector Manager": [
        "customer_account.view",
        "connectors.view",
        "connectors.view_health",
        "connectors.run_action",
    ],
    "Customer Support Manager": [
        "customer_account.view",
        "support_cases.view",
        "support_cases.create",
        "support_cases.update",
    ],
    "Customer Read Only": [
        "customer_account.view",
        "deployment.view",
        "deployment.view_health",
        "connectors.view",
        "connectors.view_health",
        "support_cases.view",
        "support_cases.create",
    ],
}

PLATFORM_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "Titan Super Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_customers.manage",
        "platform_sales.view",
        "platform_sales.manage",
        "platform_deployments.view",
        "platform_deployments.manage",
        "platform_connectors.view",
        "platform_connectors.manage",
        "platform_monitoring.view",
        "platform_audit.view",
        "platform_security.view",
        "platform_security.manage",
        "platform_licensing.view",
        "platform_licensing.manage",
        "platform_support.view",
        "platform_support.manage",
        "platform_settings.view",
        "platform_settings.manage",
    ],
    "Titan Management Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_customers.manage",
        "platform_sales.view",
        "platform_sales.manage",
        "platform_deployments.view",
        "platform_deployments.manage",
        "platform_connectors.view",
        "platform_connectors.manage",
        "platform_monitoring.view",
        "platform_support.view",
        "platform_support.manage",
        "platform_settings.view",
    ],
    "Titan Operations Supervisor": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_customers.manage",
        "platform_sales.view",
        "platform_deployments.view",
        "platform_deployments.manage",
        "platform_connectors.view",
        "platform_connectors.manage",
        "platform_monitoring.view",
        "platform_support.view",
        "platform_support.manage",
    ],
    "Titan Sales Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_sales.view",
        "platform_sales.manage",
    ],
    "Titan Support Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_deployments.view",
        "platform_deployments.manage",
        "platform_connectors.view",
        "platform_connectors.manage",
        "platform_monitoring.view",
        "platform_audit.view",
        "platform_security.view",
        "platform_support.view",
        "platform_support.manage",
        "platform_settings.view",
    ],
    "Titan Technician": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_deployments.view",
        "platform_deployments.manage",
        "platform_connectors.view",
        "platform_connectors.manage",
        "platform_monitoring.view",
        "platform_support.view",
        "platform_support.manage",
    ],
    "Titan Monitoring Admin": [
        "platform_dashboard.view",
        "platform_deployments.view",
        "platform_connectors.view",
        "platform_monitoring.view",
    ],
    "Titan Security Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_deployments.view",
        "platform_connectors.view",
        "platform_monitoring.view",
        "platform_audit.view",
        "platform_security.view",
        "platform_security.manage",
        "platform_settings.view",
        "platform_settings.manage",
    ],
    "Titan Licensing Admin": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_licensing.view",
        "platform_licensing.manage",
        "platform_settings.view",
    ],
    "Titan Read Only Auditor": [
        "platform_dashboard.view",
        "platform_customers.view",
        "platform_deployments.view",
        "platform_connectors.view",
        "platform_monitoring.view",
        "platform_audit.view",
        "platform_security.view",
        "platform_licensing.view",
        "platform_support.view",
        "platform_settings.view",
    ],
}


def get_customer_permissions_for_roles(role_names: List[str]) -> List[str]:
    permission_set: Set[str] = set()
    for role_name in role_names:
        permission_set.update(CUSTOMER_ROLE_PERMISSIONS.get(role_name, []))
    return normalize_permissions(permission_set)


def get_platform_permissions_for_roles(role_names: List[str]) -> List[str]:
    permission_set: Set[str] = set()
    for role_name in role_names:
        permission_set.update(PLATFORM_ROLE_PERMISSIONS.get(role_name, []))
    return normalize_permissions(permission_set)


def get_all_customer_roles() -> List[Dict[str, List[str]]]:
    return [
        {
            "name": role_name,
            "permissions": normalize_permissions(permissions),
        }
        for role_name, permissions in sorted(CUSTOMER_ROLE_PERMISSIONS.items())
    ]


def get_all_customer_permissions() -> List[str]:
    permission_set: Set[str] = set()
    for permissions in CUSTOMER_ROLE_PERMISSIONS.values():
        permission_set.update(permissions)
    return normalize_permissions(permission_set)


def validate_customer_role_names(role_names: List[str]) -> None:
    invalid_roles = [role_name for role_name in role_names if role_name not in CUSTOMER_ROLE_PERMISSIONS]
    if invalid_roles:
        invalid_list = ", ".join(sorted(invalid_roles))
        raise ValueError(f"Invalid customer role(s): {invalid_list}")