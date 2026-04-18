from fastapi import APIRouter, Depends

from app.api.routes.platform_auth import get_current_platform_user
from app.schemas.platform_cases import (
    PlatformCaseAssignableUser,
    PlatformCaseAssignRequest,
    PlatformCaseAssignmentResponse,
    PlatformCaseCreateRequest,
    PlatformCaseDetail,
    PlatformCasePickupListItem,
    PlatformCaseWorkflowUpdateRequest,
    PlatformMyPageSummary,
)
from app.services.platform_auth_service import DEV_PLATFORM_USERS
from app.services.platform_case_service import (
    accept_case,
    assign_case,
    create_case,
    get_case_detail,
    get_my_page_summary,
    list_cases_needing_pickup,
    update_case_workflow,
)

router = APIRouter(prefix="/platform/cases", tags=["platform-cases"])


def _build_assignable_case_users():
    items = []
    for user in DEV_PLATFORM_USERS.values():
        full_name = f"{str(user.get('first_name') or '').strip()} {str(user.get('last_name') or '').strip()}".strip()
        items.append(
            {
                "email": str(user.get("email") or ""),
                "full_name": full_name or str(user.get("email") or ""),
                "role_names": list(user.get("role_names") or []),
            }
        )

    return sorted(items, key=lambda item: item["full_name"].lower())


@router.get("/pickup", response_model=list[PlatformCasePickupListItem])
def get_cases_needing_pickup(current_user=Depends(get_current_platform_user)):
    _ = current_user
    return list_cases_needing_pickup()


@router.get("/assignable-users", response_model=list[PlatformCaseAssignableUser])
def get_assignable_case_users(current_user=Depends(get_current_platform_user)):
    _ = current_user
    return _build_assignable_case_users()


@router.get("/my-page", response_model=PlatformMyPageSummary)
def get_my_page(current_user=Depends(get_current_platform_user)):
    return get_my_page_summary(current_user)


@router.get("/{case_id}", response_model=PlatformCaseDetail)
def get_case(case_id: int, current_user=Depends(get_current_platform_user)):
    _ = current_user
    return get_case_detail(case_id)


@router.post("", response_model=PlatformCaseDetail)
def create_new_case(payload: PlatformCaseCreateRequest, current_user=Depends(get_current_platform_user)):
    return create_case(payload, current_user)


@router.post("/{case_id}/accept", response_model=PlatformCaseAssignmentResponse)
def accept_case_route(case_id: int, current_user=Depends(get_current_platform_user)):
    return accept_case(case_id, current_user)


@router.post("/{case_id}/assign", response_model=PlatformCaseAssignmentResponse)
def assign_case_route(case_id: int, payload: PlatformCaseAssignRequest, current_user=Depends(get_current_platform_user)):
    return assign_case(case_id, payload.assigned_to_name, current_user)


@router.post("/{case_id}/workflow", response_model=PlatformCaseDetail)
def update_case_workflow_route(
    case_id: int,
    payload: PlatformCaseWorkflowUpdateRequest,
    current_user=Depends(get_current_platform_user),
):
    return update_case_workflow(
        case_id=case_id,
        status=payload.status,
        escalation_target=payload.escalation_target,
        case_details=payload.case_details,
        general_notes=payload.general_notes,
        internal_notes=payload.internal_notes,
        current_user=current_user,
    )