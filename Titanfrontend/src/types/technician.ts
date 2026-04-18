export type TechnicianWorkspaceCustomerListItem = {
    id: number;
    name: string;
    status: string;
    primary_contact_name: string;
    primary_contact_email: string;
    deployment_count: number;
    connector_count: number;
};

export type TechnicianWorkspaceContact = {
    contact_type: string;
    name: string;
    title: string;
    email: string;
    phone: string;
};

export type TechnicianWorkspaceDeployment = {
    id: number;
    name: string;
    deployment_code: string;
    status: string;
    health_status: string;
    environment_type: string;
    region: string;
    version: string;
    launch_url: string;
    last_seen_at: string;
};

export type TechnicianWorkspaceConnector = {
    id: number;
    name: string;
    connector_type: string;
    status: string;
    health_status: string;
    sync_mode: string;
    auth_mode: string;
    target_system: string;
    last_sync_at: string;
};

export type TechnicianWorkspaceDetail = {
    customer_id: number;
    customer_name: string;
    customer_status: string;
    timezone: string;
    primary_contact_name: string;
    primary_contact_email: string;
    billing_email: string;
    notes: string;
    contacts: TechnicianWorkspaceContact[];
    deployments: TechnicianWorkspaceDeployment[];
    connectors: TechnicianWorkspaceConnector[];
};