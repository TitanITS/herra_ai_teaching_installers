export type PlatformDeployment = {
    id: number;
    customer_account_id: number;
    customer_account_name: string;
    name: string;
    deployment_code: string;
    status: string;
    version: string;
    environment_type: string;
    region: string;
    health_status: string;
    last_seen_at: string;
};

export type DeploymentEventSummary = {
    id: number;
    event_type: string;
    severity: string;
    message: string;
    created_at: string;
};

export type PlatformDeploymentDetail = {
    id: number;
    customer_account_id: number;
    customer_account_name: string;
    name: string;
    deployment_code: string;
    status: string;
    version: string;
    environment_type: string;
    region: string;
    launch_url: string;
    health_status: string;
    last_seen_at: string;
    events: DeploymentEventSummary[];
};