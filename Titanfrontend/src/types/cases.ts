export type PlatformCaseTimelineEvent = {
    id: number;
    event_type: string;
    actor_name: string;
    message: string;
    source_label: string;
    content: string;
    is_customer_visible: boolean;
    created_at: string;
};

export type PlatformCaseListItem = {
    id: number;
    case_number: number;
    shared_case_number: string;
    customer_account_id: number;
    status: string;
    priority: string;
    issue_type: string;
    customer_id: number;
    customer_name: string;
    contact_name: string;
    assigned_to_name: string;
    submitted_by_type: string;
    escalation_target: string;
    summary: string;
    created_at: string;
    updated_at: string;
};

export type PlatformCaseDetail = {
    id: number;
    case_number: number;
    shared_case_number: string;
    customer_account_id: number;
    status: string;
    priority: string;
    issue_type: string;
    customer_id: number;
    customer_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    submitted_by_type: string;
    created_by_name: string;
    assigned_to_name: string;
    escalation_target: string;
    summary: string;
    case_details: string;
    general_notes: string;
    internal_notes: string;
    created_at: string;
    updated_at: string;
    case_events: PlatformCaseTimelineEvent[];
};

export type PlatformCasePickupListItem = {
    id: number;
    case_number: number;
    shared_case_number: string;
    customer_account_id: number;
    status: string;
    priority: string;
    issue_type: string;
    customer_id: number;
    customer_name: string;
    contact_name: string;
    submitted_by_type: string;
    escalation_target: string;
    summary: string;
    created_at: string;
    updated_at: string;
};

export type PlatformCaseAssignableUser = {
    email: string;
    full_name: string;
    role_names: string[];
};

export type PlatformMyPageSummary = {
    my_open_cases: PlatformCaseListItem[];
    my_escalated_cases: PlatformCaseListItem[];
    waiting_on_customer_cases: PlatformCaseListItem[];
    recently_updated_cases: PlatformCaseListItem[];
    archived_cases: PlatformCaseListItem[];
};

export type PlatformCaseCreateRequest = {
    customer_id: number;
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    issue_type: string;
    summary: string;
    case_details: string;
    priority?: string;
    escalation_target?: string;
    submitted_by_type?: string;
};

export type PlatformCaseWorkflowUpdateRequest = {
    status: string;
    escalation_target: string;
    case_details: string;
    general_notes: string;
    internal_notes: string;
};

export type PlatformCaseAssignmentResponse = {
    message: string;
    case_id: number;
    assigned_to_name: string;
};
