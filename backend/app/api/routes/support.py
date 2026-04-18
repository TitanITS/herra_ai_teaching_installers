from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_customer_user
from app.schemas.support import (
    SupportCaseCreateRequest,
    SupportCaseCreateResponse,
    SupportCaseReplyRequest,
    SupportCaseReplyResponse,
    SupportCaseSummary,
    SupportResourcesResponse,
)
from app.services.support_service import (
    add_customer_support_case_reply,
    create_customer_support_case,
    get_customer_support_resources,
    list_customer_support_cases,
)

router = APIRouter(prefix="/customer/support", tags=["Customer Support"])


@router.get("/cases", response_model=List[SupportCaseSummary])
def customer_support_cases(
    current_user: dict = Depends(get_current_customer_user),
):
    return list_customer_support_cases(current_user)


@router.post("/cases", response_model=SupportCaseCreateResponse)
def customer_support_case_create(
    payload: SupportCaseCreateRequest,
    current_user: dict = Depends(get_current_customer_user),
):
    return create_customer_support_case(
        current_user=current_user,
        subject=payload.subject,
        severity=payload.severity,
        summary=payload.summary,
    )


@router.get("/resources", response_model=SupportResourcesResponse)
def customer_support_resources(
    current_user: dict = Depends(get_current_customer_user),
):
    return get_customer_support_resources(current_user)


@router.post("/cases/{case_id}/reply", response_model=SupportCaseReplyResponse)
def customer_support_case_reply(
    case_id: int,
    payload: SupportCaseReplyRequest,
    current_user: dict = Depends(get_current_customer_user),
):
    return add_customer_support_case_reply(
        case_id=case_id,
        current_user=current_user,
        message=payload.message,
    )