from typing import List

from pydantic import BaseModel


class PlatformCaseTimelineEvent(BaseModel):
    id: int
    event_type: str
    actor_name: str
    actor_type: str = ""
    actor_label: str = ""
    entry_kind: str = ""
    message: str
    source_label: str = ""
    content: str = ""
    is_customer_visible: bool = True
    created_at: str


class PlatformCaseListItem(BaseModel):
    id: int
    case_number: int
    shared_case_number: str = ""
    customer_account_id: int
    status: str
    status_label: str = ""
    priority: str
    issue_type: str
    customer_id: int
    customer_name: str
    contact_name: str
    assigned_to_name: str
    submitted_by_type: str
    escalation_target: str
    summary: str
    created_at: str
    updated_at: str


class PlatformCaseDetail(BaseModel):
    id: int
    case_number: int
    shared_case_number: str = ""
    customer_account_id: int
    status: str
    status_label: str = ""
    priority: str
    issue_type: str
    customer_id: int
    customer_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    submitted_by_type: str
    created_by_name: str
    assigned_to_name: str
    escalation_target: str
    summary: str
    case_details: str
    general_notes: str
    internal_notes: str
    created_at: str
    updated_at: str
    case_events: List[PlatformCaseTimelineEvent]


class PlatformCaseCreateRequest(BaseModel):
    customer_id: int
    contact_name: str
    contact_email: str = ""
    contact_phone: str = ""
    issue_type: str
    summary: str
    case_details: str
    priority: str = "Medium"
    escalation_target: str = ""
    submitted_by_type: str = "Staff"


class PlatformCaseAssignRequest(BaseModel):
    assigned_to_name: str


class PlatformCaseWorkflowUpdateRequest(BaseModel):
    status: str
    escalation_target: str = ""
    case_details: str = ""
    general_notes: str = ""
    internal_notes: str = ""


class PlatformCasePickupListItem(BaseModel):
    id: int
    case_number: int
    shared_case_number: str = ""
    customer_account_id: int
    status: str
    status_label: str = ""
    priority: str
    issue_type: str
    customer_id: int
    customer_name: str
    contact_name: str
    submitted_by_type: str
    escalation_target: str
    summary: str
    created_at: str
    updated_at: str


class PlatformCaseAssignableUser(BaseModel):
    email: str
    full_name: str
    role_names: List[str]


class PlatformMyPageSummary(BaseModel):
    my_open_cases: List[PlatformCaseListItem]
    my_escalated_cases: List[PlatformCaseListItem]
    waiting_on_customer_cases: List[PlatformCaseListItem]
    recently_updated_cases: List[PlatformCaseListItem]
    archived_cases: List[PlatformCaseListItem]


class PlatformCaseMessageResponse(BaseModel):
    message: str


class PlatformCaseAssignmentResponse(BaseModel):
    message: str
    case_id: int
    assigned_to_name: str