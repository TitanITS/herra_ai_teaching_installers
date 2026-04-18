from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission
from app.schemas.customer_users import (
    CustomerUserCreateRequest,
    CustomerUserInviteResponse,
    CustomerUserListItem,
    CustomerUserMessageResponse,
    CustomerUserUpdateRequest,
)
from app.services.customer_user_service import (
    create_customer_user_invite,
    disable_customer_user,
    enable_customer_user,
    get_customer_user_detail,
    list_customer_users,
    resend_customer_user_invite,
    update_customer_user,
)

router = APIRouter(prefix="/customer/users", tags=["Customer Users"])


@router.get("", response_model=List[CustomerUserListItem])
def customer_users_list(
    current_user: dict = Depends(require_customer_permission("customer_users.view")),
):
    return list_customer_users(current_user)


@router.post("", response_model=CustomerUserInviteResponse)
def customer_users_create(
    payload: CustomerUserCreateRequest,
    current_user: dict = Depends(require_customer_permission("customer_users.create")),
):
    return create_customer_user_invite(
        current_user=current_user,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_names=payload.role_names,
    )


@router.get("/{user_id}", response_model=CustomerUserListItem)
def customer_users_detail(
    user_id: int,
    current_user: dict = Depends(require_customer_permission("customer_users.view")),
):
    return get_customer_user_detail(current_user, user_id)


@router.patch("/{user_id}", response_model=CustomerUserListItem)
def customer_users_update(
    user_id: int,
    payload: CustomerUserUpdateRequest,
    current_user: dict = Depends(require_customer_permission("customer_users.update")),
):
    return update_customer_user(
        current_user=current_user,
        user_id=user_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )


@router.post("/{user_id}/disable", response_model=CustomerUserMessageResponse)
def customer_users_disable(
    user_id: int,
    current_user: dict = Depends(require_customer_permission("customer_users.disable")),
):
    return disable_customer_user(current_user, user_id)


@router.post("/{user_id}/enable", response_model=CustomerUserMessageResponse)
def customer_users_enable(
    user_id: int,
    current_user: dict = Depends(require_customer_permission("customer_users.disable")),
):
    return enable_customer_user(current_user, user_id)


@router.post("/{user_id}/invites/resend", response_model=CustomerUserMessageResponse)
def customer_users_resend_invite(
    user_id: int,
    current_user: dict = Depends(require_customer_permission("customer_users.create")),
):
    return resend_customer_user_invite(current_user, user_id)