from pydantic import BaseModel


class PlatformMonitoringSummary(BaseModel):
    total_customers: int
    total_deployments: int
    active_deployments: int
    degraded_deployments: int
    total_connectors: int
    healthy_connectors: int
    open_support_cases: int
    overdue_billing_accounts: int