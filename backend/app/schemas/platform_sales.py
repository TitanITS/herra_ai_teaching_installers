from typing import List

from pydantic import BaseModel


class PlatformSalesContact(BaseModel):
    full_name: str
    title: str
    email: str
    main_phone: str
    extension: str
    cell_phone: str
    recommended_permission_role: str
    decision_priority: str


class PlatformSalesService(BaseModel):
    service_name: str
    service_type: str
    status: str
    billing_cycle: str
    price_display: str


class PlatformSalesOpportunityListItem(BaseModel):
    id: int
    opportunity_kind: str
    renewal_of_customer_id: int | None
    renewal_term_number: int | None
    customer_number_preview: str
    legal_name: str
    display_name: str
    slug: str
    authorized_purchasing_contact: str
    sales_stage: str
    quote_status: str
    contract_status: str
    sales_consultant_name: str
    estimated_monthly_value_display: str
    expected_close_date: str
    proposed_service_count: int
    handoff_customer_id: int | None
    payment_confirmed: bool
    account_manager_intro_complete: bool
    ready_for_implementation: bool
    auto_customer_ready: bool


class PlatformSalesOpportunityDetail(BaseModel):
    id: int
    opportunity_kind: str
    renewal_of_customer_id: int | None
    renewal_term_number: int | None
    customer_number_preview: str
    legal_name: str
    display_name: str
    slug: str
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
    sales_consultant_name: str
    account_manager_name: str
    implementation_engineer_name: str
    sales_stage: str
    quote_status: str
    contract_status: str
    timezone: str
    expected_close_date: str
    desired_go_live_date: str
    estimated_monthly_value_display: str
    proposed_connector_count: int
    proposed_license_count: int
    payment_confirmed: bool
    account_manager_intro_complete: bool
    ready_for_implementation: bool
    auto_customer_ready: bool
    notes: str
    handoff_customer_id: int | None
    contacts: List[PlatformSalesContact]
    services: List[PlatformSalesService]


class PlatformSalesCreateContactRequest(BaseModel):
    full_name: str
    title: str
    email: str
    main_phone: str
    extension: str
    cell_phone: str = ""
    recommended_permission_role: str
    decision_priority: str


class PlatformSalesCreateServiceRequest(BaseModel):
    service_name: str
    service_type: str
    status: str
    billing_cycle: str
    price_display: str


class PlatformSalesCreateOpportunityRequest(BaseModel):
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
    sales_consultant_name: str
    account_manager_name: str
    implementation_engineer_name: str
    sales_stage: str
    quote_status: str
    contract_status: str
    timezone: str
    expected_close_date: str = ""
    desired_go_live_date: str = ""
    estimated_monthly_value_display: str
    proposed_connector_count: int = 0
    proposed_license_count: int = 0
    payment_confirmed: bool = False
    account_manager_intro_complete: bool = False
    ready_for_implementation: bool = False
    notes: str = ""
    contacts: List[PlatformSalesCreateContactRequest]
    services: List[PlatformSalesCreateServiceRequest]