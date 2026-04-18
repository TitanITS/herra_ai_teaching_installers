export type PlatformDashboardSummary = {
    total_customers: number;
    active_deployments: number;
    active_connectors: number;
    deployments_needing_attention: number;
    connectors_needing_attention: number;
    latest_deployment_seen_at: string;
    latest_connector_sync_at: string;
    source: "platform_dashboard" | "frontend_fallback";
};
