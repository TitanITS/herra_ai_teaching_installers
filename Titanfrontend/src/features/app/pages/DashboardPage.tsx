import { useEffect, useState } from "react";
import { getPlatformDashboard } from "../../../api/dashboard";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatCard from "../../../components/common/StatCard";
import LoadingState from "../../../components/common/LoadingState";
import { useAuth } from "../../../hooks/auth/useAuth";
import type { PlatformDashboardSummary } from "../../../types/dashboard";

export default function DashboardPage() {
    const { token } = useAuth();
    const [summary, setSummary] = useState<PlatformDashboardSummary | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            if (!token) {
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const response = await getPlatformDashboard(token);

                if (isMounted) {
                    setSummary(response);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Failed to load dashboard.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void load();

        return () => {
            isMounted = false;
        };
    }, [token]);

    return (
        <>
            <PageHeader title="Dashboard" />

            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading ? (
                <LoadingState message="Loading platform dashboard..." />
            ) : summary ? (
                <>
                    <div className="stats-grid">
                        <StatCard
                            label="Total Customers"
                            value={summary.total_customers}
                            helper="Distinct customer accounts represented in current platform data."
                        />
                        <StatCard
                            label="Active Deployments"
                            value={summary.active_deployments}
                            helper="Deployments currently marked active."
                        />
                        <StatCard
                            label="Active Connectors"
                            value={summary.active_connectors}
                            helper="Connectors currently marked active."
                        />
                        <StatCard
                            label="Data Source"
                            value={summary.source === "platform_dashboard" ? "Backend" : "Fallback"}
                            helper="Uses /api/platform/dashboard when available."
                        />
                    </div>

                    <div className="two-column-grid">
                        <SectionCard title="Operational Attention">
                            <div className="metric-line">
                                <span>Deployments needing attention</span>
                                <strong>{summary.deployments_needing_attention}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Connectors needing attention</span>
                                <strong>{summary.connectors_needing_attention}</strong>
                            </div>
                        </SectionCard>

                        <SectionCard title="Latest Activity">
                            <div className="metric-line">
                                <span>Latest deployment seen</span>
                                <strong>{summary.latest_deployment_seen_at || "Not reported"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Latest connector sync</span>
                                <strong>{summary.latest_connector_sync_at || "Not reported"}</strong>
                            </div>
                        </SectionCard>
                    </div>
                </>
            ) : null}
        </>
    );
}