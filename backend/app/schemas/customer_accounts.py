from typing import List

from pydantic import BaseModel


class NotificationSummary(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    is_active: bool


class AccountManagerSummary(BaseModel):
    name: str
    title: str
    email: str
    phone: str


class CustomerAccountSummary(BaseModel):
    id: int
    name: str
    slug: str
    primary_contact_name: str
    primary_contact_email: str
    billing_email: str
    status: str
    timezone: str


class CustomerDashboardSummary(BaseModel):
    customer_account: CustomerAccountSummary
    notifications: List[NotificationSummary]
    tokens_purchased: int
    tokens_used: int
    tokens_remaining: int
    monthly_billing_estimate: float
    deployment_status: str
    deployment_version: str
    connector_count: int
    connector_healthy_count: int
    account_manager: AccountManagerSummary