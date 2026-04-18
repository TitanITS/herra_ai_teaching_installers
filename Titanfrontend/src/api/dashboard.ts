import { getPlatformConnectors } from "./connectors";
import { getPlatformDeployments } from "./deployments";
import type { PlatformDashboardSummary } from "../types/dashboard";

function normalizeStatus(value: string) {
    return value.trim().toLowerCase();
}

export async function getPlatformDashboard(token: string) {
    const [deployments, connectors] = await Promise.all([
        getPlatformDeployments(token),
        getPlatformConnectors(token),
    ]);

    const activeDeployments = deployments.filter((item) => normalizeStatus(item.status) === "active").length;
    const activeConnectors = connectors.filter((item) => normalizeStatus(item.status) === "active").length;
    const deploymentsNeedingAttention = deployments.filter((item) => normalizeStatus(item.health_status) !== "healthy").length;
    const connectorsNeedingAttention = connectors.filter((item) => normalizeStatus(item.health_status) !== "healthy").length;

    return {
        total_customers: new Set([
            ...deployments.map((item) => item.customer_account_id),
            ...connectors.map((item) => item.customer_account_id),
        ]).size,
        active_deployments: activeDeployments,
        active_connectors: activeConnectors,
        deployments_needing_attention: deploymentsNeedingAttention,
        connectors_needing_attention: connectorsNeedingAttention,
        latest_deployment_seen_at: deployments[0]?.last_seen_at ?? "",
        latest_connector_sync_at: connectors[0]?.last_sync_at ?? "",
        source: "frontend_fallback",
    } satisfies PlatformDashboardSummary;
}