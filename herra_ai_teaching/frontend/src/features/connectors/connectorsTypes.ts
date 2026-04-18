export type Connector = {
    id: string;
    name: string;
    os: string;
    created_at: string;
    last_seen: string;
    meta?: Record<string, any>;
};

export type ConnectorsStatusResponse = {
    connectors: Connector[];
};