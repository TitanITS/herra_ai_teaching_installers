export type PlatformConnector = {
    id: number;
    customer_account_id: number;
    customer_account_name: string;
    name: string;
    connector_type: string;
    status: string;
    health_status: string;
    last_sync_at: string;
    sync_mode: string;
    auth_mode: string;
    version: string;
    target_system: string;
};

export type ConnectorEventSummary = {
    id: number;
    event_type: string;
    severity: string;
    message: string;
    created_at: string;
};

export type PlatformConnectorDetail = {
    id: number;
    customer_account_id: number;
    customer_account_name: string;
    name: string;
    connector_type: string;
    status: string;
    health_status: string;
    last_sync_at: string;
    sync_mode: string;
    auth_mode: string;
    version: string;
    target_system: string;
    events: ConnectorEventSummary[];
};