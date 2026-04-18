from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_platform_permission
from app.schemas.platform_sales import (
    PlatformSalesCreateOpportunityRequest,
    PlatformSalesOpportunityDetail,
    PlatformSalesOpportunityListItem,
)
from app.services.sales_pipeline_service import (
    create_platform_sales_opportunity,
    create_platform_sales_renewal_from_customer,
    get_platform_sales_opportunity_detail,
    list_platform_sales_opportunities,
)

router = APIRouter(prefix="/platform/sales", tags=["Platform Sales"])


@router.get("", response_model=List[PlatformSalesOpportunityListItem])
def platform_sales_list(
    current_user: dict = Depends(require_platform_permission("platform_sales.view")),
):
    _ = current_user
    return list_platform_sales_opportunities()


@router.post("", response_model=PlatformSalesOpportunityDetail)
def platform_sales_create(
    payload: PlatformSalesCreateOpportunityRequest,
    current_user: dict = Depends(require_platform_permission("platform_sales.manage")),
):
    _ = current_user
    return create_platform_sales_opportunity(payload)


@router.post("/renewals/{customer_id}", response_model=PlatformSalesOpportunityDetail)
def platform_sales_create_renewal(
    customer_id: int,
    current_user: dict = Depends(require_platform_permission("platform_sales.manage")),
):
    _ = current_user
    return create_platform_sales_renewal_from_customer(customer_id)


@router.get("/{opportunity_id}", response_model=PlatformSalesOpportunityDetail)
def platform_sales_detail(
    opportunity_id: int,
    current_user: dict = Depends(require_platform_permission("platform_sales.view")),
):
    _ = current_user
    return get_platform_sales_opportunity_detail(opportunity_id)
