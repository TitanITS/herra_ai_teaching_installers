from typing import List

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_platform_permission
from app.schemas.platform_customers import (
    PlatformCustomerAssignmentSummary,
    PlatformCustomerCreateRequest,
    PlatformCustomerDetail,
    PlatformCustomerInviteResponse,
    PlatformCustomerInviteSendRequest,
    PlatformCustomerListItem,
    PlatformCustomerMessageResponse,
)
from app.services.customer_account_service import (
    create_platform_customer,
    get_platform_customer_assignments,
    get_platform_customer_detail,
    list_platform_customers,
    resend_platform_customer_invite,
    revoke_platform_customer_invite,
    send_platform_customer_invite,
)

router = APIRouter(prefix="/platform/customers", tags=["Platform Customers"])


@router.get("", response_model=List[PlatformCustomerListItem])
def platform_customers_list(
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return list_platform_customers()


@router.post("", response_model=PlatformCustomerDetail)
def platform_customer_create(
    payload: PlatformCustomerCreateRequest,
    current_user: dict = Depends(require_platform_permission("platform_customers.manage")),
):
    _ = current_user
    return create_platform_customer(payload)


@router.get("/{customer_id}", response_model=PlatformCustomerDetail)
def platform_customer_detail(
    customer_id: int,
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return get_platform_customer_detail(customer_id)


@router.get("/{customer_id}/assignments", response_model=List[PlatformCustomerAssignmentSummary])
def platform_customer_assignments(
    customer_id: int,
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return get_platform_customer_assignments(customer_id)


@router.post("/{customer_id}/invites", response_model=PlatformCustomerInviteResponse)
def platform_customer_send_invite(
    customer_id: int,
    payload: PlatformCustomerInviteSendRequest,
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return send_platform_customer_invite(
        customer_id=customer_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_names=payload.role_names,
    )


@router.post("/{customer_id}/invites/resend", response_model=PlatformCustomerMessageResponse)
def platform_customer_resend_invite(
    customer_id: int,
    email: str = Query(...),
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return resend_platform_customer_invite(customer_id, email)


@router.post("/{customer_id}/invites/revoke", response_model=PlatformCustomerMessageResponse)
def platform_customer_revoke_invite(
    customer_id: int,
    email: str = Query(...),
    current_user: dict = Depends(require_platform_permission("platform_customers.view")),
):
    _ = current_user
    return revoke_platform_customer_invite(customer_id, email)