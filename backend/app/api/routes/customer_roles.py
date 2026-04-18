from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission
from app.schemas.customer_roles import CustomerPermissionSummary, CustomerRoleSummary
from app.schemas.customer_users import CustomerUserListItem, CustomerUserMessageResponse, CustomerUserRolesUpdateRequest
from app.services.customer_user_service import assign_roles_to_customer_user
from app.services.role_service import get_all_customer_permissions, get_all_customer_roles

router = APIRouter(prefix="/customer", tags=["Customer Roles"])


@router.get("/roles", response_model=List[CustomerRoleSummary])
def customer_roles_list(
    current_user: dict = Depends(require_customer_permission("customer_roles.view")),
):
    _ = current_user
    return get_all_customer_roles()


@router.get("/permissions", response_model=List[CustomerPermissionSummary])
def customer_permissions_list(
    current_user: dict = Depends(require_customer_permission("customer_roles.view")),
):
    _ = current_user
    return [{"code": permission_code} for permission_code in get_all_customer_permissions()]


@router.post("/users/{user_id}/roles", response_model=CustomerUserListItem)
def customer_assign_roles(
    user_id: int,
    payload: CustomerUserRolesUpdateRequest,
    current_user: dict = Depends(require_customer_permission("customer_roles.assign")),
):
    return assign_roles_to_customer_user(
        current_user=current_user,
        user_id=user_id,
        role_names=payload.role_names,
    )