from typing import List

from pydantic import BaseModel


class PlatformCustomerAssignmentSummary(BaseModel):
    role: str
    name: str
    email: str
    phone: str


class PlatformCustomerContact(BaseModel):
    contact_source: str
    full_name: str
    title: str
    email: str
    main_phone: str
    extension: str
    cell_phone: str
    permission_role: str
    decision_priority: str


class PlatformCustomerLinkedDeployment(BaseModel):
    license_id: str
    service_name: str
    status: str


class PlatformCustomerLinkedConnector(BaseModel):
    license_id: str
    connector_name: str
    status: str


class PlatformCustomerSupportSummary(BaseModel):
    tier_name: str
    response_target: str
    coverage_hours: str
    included_channels: List[str]
    escalation_level: str
    notes: str


class PlatformCustomerCompanyDetails(BaseModel):
    legal_name: str
    display_name: str
    authorized_purchasing_contact: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    main_phone: str
    extension: str
    cell_phone: str
    website: str
    industry: str
    company_size: str
    notes: str
    contract_start_date: str
    renewal_date: str


class PlatformCustomerListItem(BaseModel):
    id: int
    customer_number: str
    base_account_number: int
    term_number: int
    display_name: str
    legal_name: str
    customer_status: str
    billing_status: str
    primary_contact_name: str
    primary_contact_email: str
    account_manager_name: str
    support_tier_name: str
    deployment_count: int
    connector_count: int
    notes_summary: str


class PlatformCustomerDetail(BaseModel):
    id: int
    customer_number: str
    base_account_number: int
    term_number: int
    slug: str
    company_details: PlatformCustomerCompanyDetails
    billing_status: str
    customer_status: str
    account_manager: PlatformCustomerAssignmentSummary
    sales_consultant: PlatformCustomerAssignmentSummary
    implementation_engineer: PlatformCustomerAssignmentSummary
    contacts: List[PlatformCustomerContact]
    deployments: List[PlatformCustomerLinkedDeployment]
    connectors: List[PlatformCustomerLinkedConnector]
    support_summary: PlatformCustomerSupportSummary


class PlatformCustomerCreateContactRequest(BaseModel):
    contact_source: str
    full_name: str
    title: str
    email: str
    main_phone: str
    extension: str
    cell_phone: str = ""
    permission_role: str
    decision_priority: str


class PlatformCustomerCreateRequest(BaseModel):
    legal_name: str
    display_name: str
    slug: str = ""
    authorized_purchasing_contact: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    main_phone: str
    extension: str
    cell_phone: str = ""
    website: str
    industry: str
    company_size: str
    notes: str = ""
    contract_start_date: str
    renewal_date: str = ""
    billing_status: str
    customer_status: str
    account_manager_name: str
    sales_consultant_name: str
    implementation_engineer_name: str
    contacts: List[PlatformCustomerCreateContactRequest]


class PlatformCustomerInviteSendRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role_names: List[str]


class PlatformCustomerInviteResponse(BaseModel):
    message: str
    invite_token: str
    invited_email: str


class PlatformCustomerMessageResponse(BaseModel):
    message: str