export type SupportTimelineEntry = {
    id: number;
    author_name: string;
    author_type: string;
    visibility: string;
    is_customer_visible: boolean;
    message: string;
    created_at: string;
};

export type SupportCase = {
    id: number;
    internal_case_id: number;
    customer_account_id: number;
    case_number: string;
    subject: string;
    severity: string;
    status: string;
    summary: string;
    created_at: string;
    updated_at: string;
    assigned_team: string;
    comments: SupportTimelineEntry[];
};

export type SupportCaseCreateRequest = {
    subject: string;
    severity: string;
    summary: string;
};

export type SupportCaseCreateResponse = {
    message: string;
    case: SupportCase;
};

export type SupportResources = {
    account_manager: {
        name: string;
        title: string;
        email: string;
        phone: string;
    };
    support_contact: {
        name: string;
        title: string;
        email: string;
        phone: string;
        hours: string;
        urgent_message: string;
    };
    severity_guidance: {
        level: string;
        response_target: string;
        description: string;
    }[];
    quick_help_articles: {
        id: number;
        title: string;
        description: string;
    }[];
};

export type SupportCaseReplyRequest = {
    message: string;
};

export type SupportCaseReplyResponse = {
    message: string;
    case: SupportCase;
};