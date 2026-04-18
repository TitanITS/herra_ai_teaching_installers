from typing import List

from pydantic import BaseModel

from app.schemas.customer_accounts import AccountManagerSummary


class SupportTimelineEntry(BaseModel):
    id: int
    author_name: str
    author_type: str
    author_label: str
    entry_kind: str
    visibility: str
    is_customer_visible: bool
    message: str
    source_label: str = ""
    created_at: str


class SupportCaseSummary(BaseModel):
    id: int
    internal_case_id: int
    customer_account_id: int
    case_number: str
    subject: str
    severity: str
    status: str
    customer_status_label: str
    summary: str
    created_at: str
    updated_at: str
    assigned_team: str
    comments: List[SupportTimelineEntry]


class SupportCaseCreateRequest(BaseModel):
    subject: str
    severity: str
    summary: str


class SupportCaseCreateResponse(BaseModel):
    message: str
    case: SupportCaseSummary


class SupportCaseReplyRequest(BaseModel):
    message: str


class SupportCaseReplyResponse(BaseModel):
    message: str
    case: SupportCaseSummary


class SupportContactSummary(BaseModel):
    name: str
    title: str
    email: str
    phone: str
    hours: str
    urgent_message: str


class SupportSeverityGuide(BaseModel):
    level: str
    response_target: str
    description: str


class SupportQuickHelpArticle(BaseModel):
    id: int
    title: str
    description: str


class SupportResourcesResponse(BaseModel):
    account_manager: AccountManagerSummary
    support_contact: SupportContactSummary
    severity_guidance: List[SupportSeverityGuide]
    quick_help_articles: List[SupportQuickHelpArticle]