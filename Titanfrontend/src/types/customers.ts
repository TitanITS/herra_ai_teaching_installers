export type PlatformCustomerListItem = {
    id: number;
    customer_number: string;
    base_account_number: number;
    term_number: number;
    display_name: string;
    legal_name: string;
    customer_status: string;
    billing_status: string;
    primary_contact_name: string;
    primary_contact_email: string;
    account_manager_name: string;
    support_tier_name: string;
    deployment_count: number;
    connector_count: number;
    notes_summary: string;
};

export type PlatformCustomerAssignmentSummary = {
    role: string;
    name: string;
    email: string;
    phone: string;
};

export type PlatformCustomerContact = {
    contact_source: string;
    full_name: string;
    title: string;
    email: string;
    main_phone: string;
    extension: string;
    cell_phone: string;
    permission_role: string;
    decision_priority: string;
};

export type PlatformCustomerLinkedDeployment = {
    license_id: string;
    service_name: string;
    status: string;
};

export type PlatformCustomerLinkedConnector = {
    license_id: string;
    connector_name: string;
    status: string;
};

export type PlatformCustomerSupportSummary = {
    tier_name: string;
    response_target: string;
    coverage_hours: string;
    included_channels: string[];
    escalation_level: string;
    notes: string;
};

export type PlatformCustomerCompanyDetails = {
    legal_name: string;
    display_name: string;
    authorized_purchasing_contact: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    main_phone: string;
    extension: string;
    cell_phone: string;
    website: string;
    industry: string;
    company_size: string;
    notes: string;
    contract_start_date: string;
    renewal_date: string;
};

export type PlatformCustomerDetail = {
    id: number;
    customer_number: string;
    base_account_number: number;
    term_number: number;
    slug: string;
    company_details: PlatformCustomerCompanyDetails;
    billing_status: string;
    customer_status: string;
    account_manager: PlatformCustomerAssignmentSummary;
    sales_consultant: PlatformCustomerAssignmentSummary;
    implementation_engineer: PlatformCustomerAssignmentSummary;
    contacts: PlatformCustomerContact[];
    deployments: PlatformCustomerLinkedDeployment[];
    connectors: PlatformCustomerLinkedConnector[];
    support_summary: PlatformCustomerSupportSummary;
};

export type PlatformCustomerCreateContactInput = {
    contact_source: string;
    full_name: string;
    title: string;
    email: string;
    main_phone: string;
    extension: string;
    cell_phone: string;
    permission_role: string;
    decision_priority: string;
};

export type PlatformCustomerCreateInput = {
    legal_name: string;
    display_name: string;
    slug: string;
    authorized_purchasing_contact: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    main_phone: string;
    extension: string;
    cell_phone: string;
    website: string;
    industry: string;
    company_size: string;
    notes: string;
    contract_start_date: string;
    renewal_date: string;
    billing_status: string;
    customer_status: string;
    account_manager_name: string;
    sales_consultant_name: string;
    implementation_engineer_name: string;
    contacts: PlatformCustomerCreateContactInput[];
};