from typing import Dict


def get_platform_monitoring_summary() -> Dict[str, int]:
    return {
        "total_customers": 1,
        "total_deployments": 1,
        "active_deployments": 1,
        "degraded_deployments": 0,
        "total_connectors": 4,
        "healthy_connectors": 3,
        "open_support_cases": 2,
        "overdue_billing_accounts": 0,
    }