from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_platform_permission
from app.schemas.platform_technician import (
    PlatformTechnicianWorkspaceCustomerListItem,
    PlatformTechnicianWorkspaceDetail,
)
from app.services.platform_technician_service import (
    get_platform_technician_workspace_detail,
    list_platform_technician_customers,
)

router = APIRouter(prefix="/platform/technician", tags=["Platform Technician"])


@router.get("/customers", response_model=List[PlatformTechnicianWorkspaceCustomerListItem])
def platform_technician_customers(
    current_user: dict = Depends(require_platform_permission("platform_support.view")),
):
    _ = current_user
    return list_platform_technician_customers()


@router.get("/customers/{customer_id}", response_model=PlatformTechnicianWorkspaceDetail)
def platform_technician_customer_detail(
    customer_id: int,
    current_user: dict = Depends(require_platform_permission("platform_support.view")),
):
    _ = current_user
    return get_platform_technician_workspace_detail(customer_id)