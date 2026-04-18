from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission
from app.schemas.customer_accounts import (
    AccountManagerSummary,
    CustomerAccountSummary,
    CustomerDashboardSummary,
    NotificationSummary,
)
from app.services.customer_account_service import (
    get_customer_account_manager,
    get_customer_account_summary,
    get_customer_dashboard_summary,
    get_customer_notifications,
)

router = APIRouter(prefix="/customer", tags=["Customer Account"])


@router.get("/account", response_model=CustomerAccountSummary)
def customer_account(
    current_user: dict = Depends(require_customer_permission("customer_account.view")),
):
    return get_customer_account_summary(current_user)


@router.get("/account-manager", response_model=AccountManagerSummary)
def customer_account_manager(
    current_user: dict = Depends(require_customer_permission("customer_account.view")),
):
    return get_customer_account_manager(current_user)


@router.get("/notifications", response_model=List[NotificationSummary])
def customer_notifications(
    current_user: dict = Depends(require_customer_permission("customer_account.view")),
):
    return get_customer_notifications(current_user)


@router.get("/dashboard-summary", response_model=CustomerDashboardSummary)
def customer_dashboard_summary(
    current_user: dict = Depends(require_customer_permission("customer_account.view")),
):
    return get_customer_dashboard_summary(current_user)