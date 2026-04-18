export type DeploymentRecord = {
    id?: number;
    customer_account_id?: number;
    name: string;
    deployment_code: string;
    status: string;
    version: string;
    region: string;
    environment_type: string;
};

export type DeploymentHealthRecord = {
    health_status: string;
    cpu_percent: number;
    memory_percent: number;
    last_reported_at: string;
};

export type DeploymentEventRecord = {
    id: string;
    event_type: string;
    severity: string;
    message: string;
    created_at: string;
};

export type DeploymentLaunchResponse = {
    launch_url: string;
    message: string;
};

export type ConnectorReleaseSummary = {
    id: number;
    release_code: string;
    name: string;
    operating_system: string;
    architecture: string;
    version: string;
    filename: string;
    download_url: string;
    checksum_sha256: string;
    install_notes: string;
    is_active: boolean;
    is_latest: boolean;
    released_at: string;
};

export type DeploymentConnectorSlotSummary = {
    slot_id: number;
    deployment_id: number;
    connector_name: string;
    site_label: string;
    status: string;
    included_in_plan: boolean;
    operating_system: string | null;
    architecture: string | null;
    release_id: number | null;
    release_name: string | null;
    release_version: string | null;
    installer_filename: string | null;
    installer_download_url: string | null;
    install_notes: string | null;
    bootstrap_status: string;
    last_bootstrap_created_at: string | null;
    last_bootstrap_expires_at: string | null;
    last_bootstrap_used: boolean;
    last_bootstrap_used_at: string | null;
    last_bootstrap_used_by_name: string | null;
};

export type CustomerDeploymentProvisioningSummary = {
    deployment_id: number;
    deployment_name: string;
    deployment_code: string;
    included_connector_count: number;
    additional_connector_count: number;
    total_connector_count: number;
    connector_releases: ConnectorReleaseSummary[];
    connector_slots: DeploymentConnectorSlotSummary[];
};

export type ProvisioningBootstrapCreateRequest = {
    slot_id: number;
    release_id: number;
    expires_minutes: number;
    connector_name?: string;
    site_label?: string;
};

export type ProvisioningBootstrapResponse = {
    slot_id: number;
    release_id: number;
    bootstrap_id: string;
    bootstrap_token: string;
    bootstrap_label: string;
    bootstrap_expires_at: string;
    connector_name: string;
    operating_system: string;
    architecture: string;
    installer_filename: string;
    installer_download_url: string;
    install_notes: string;
    message: string;
};