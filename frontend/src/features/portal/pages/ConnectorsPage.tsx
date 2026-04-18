import { useEffect, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    getCustomerConnectorDetail,
    getCustomerConnectorHealth,
    getCustomerConnectorJobs,
    getCustomerConnectors,
    runCustomerConnectorAction,
} from "../../../api/connectors";

type ConnectorListItem = {
    id: number;
    name: string;
    connector_code: string;
    health_status: string;
};

type ConnectorDetailRecord = {
    id: number;
    name: string;
    connector_code: string;
    status: string;
    version: string;
    last_sync_at: string;
    available_actions: string[];
};

type ConnectorHealthRecord = {
    health_status: string;
    success_rate_percent: number;
    queue_depth: number;
    last_reported_at: string;
};

type ConnectorJobRecord = {
    id: string;
    job_type: string;
    status: string;
    result_summary: string;
    created_at: string;
};

function formatActionLabel(actionCode: string) {
    return actionCode
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function ConnectorsPage() {
    const { token } = useAuth();

    const [connectors, setConnectors] = useState<ConnectorListItem[]>([]);
    const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(null);
    const [detail, setDetail] = useState<ConnectorDetailRecord | null>(null);
    const [health, setHealth] = useState<ConnectorHealthRecord | null>(null);
    const [jobs, setJobs] = useState<ConnectorJobRecord[]>([]);
    const [error, setError] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadConnectorList = async () => {
        if (!token) {
            return;
        }

        const connectorList = (await getCustomerConnectors(token)) as ConnectorListItem[];
        setConnectors(connectorList);

        if (connectorList.length > 0 && selectedConnectorId === null) {
            setSelectedConnectorId(connectorList[0].id);
        }
    };

    const loadSelectedConnector = async (connectorId: number) => {
        if (!token) {
            return;
        }

        const [detailData, healthData, jobData] = await Promise.all([
            getCustomerConnectorDetail(token, connectorId),
            getCustomerConnectorHealth(token, connectorId),
            getCustomerConnectorJobs(token, connectorId),
        ]);

        setDetail(detailData as ConnectorDetailRecord);
        setHealth(healthData as ConnectorHealthRecord);
        setJobs((jobData as ConnectorJobRecord[]) ?? []);
    };

    useEffect(() => {
        const loadAll = async () => {
            if (!token) {
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const connectorList = (await getCustomerConnectors(token)) as ConnectorListItem[];
                setConnectors(connectorList);

                const firstId =
                    selectedConnectorId ?? (connectorList.length > 0 ? connectorList[0].id : null);

                if (firstId !== null) {
                    setSelectedConnectorId(firstId);
                    await loadSelectedConnector(firstId);
                } else {
                    setDetail(null);
                    setHealth(null);
                    setJobs([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load connectors.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleConnectorSelect = async (connectorId: number) => {
        setSelectedConnectorId(connectorId);
        setError("");
        setMessage("");

        try {
            await loadSelectedConnector(connectorId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load connector detail.");
        }
    };

    const handleAction = async (actionCode: string) => {
        if (!token || selectedConnectorId === null) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const response = await runCustomerConnectorAction(token, selectedConnectorId, actionCode);
            setMessage(`${response.message} Action: ${formatActionLabel(response.action_code)}.`);
            await loadConnectorList();
            await loadSelectedConnector(selectedConnectorId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to run connector action.");
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Secure Network Connectors"
                subtitle="View connector state, health reporting, sync history, and approved customer actions."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading ? (
                <div className="center-message">Loading connectors...</div>
            ) : (
                <>
                    <div className="dashboard-section">
                        <div className="content-grid content-grid--3">
                            <SectionCard title="Connector Inventory">
                                {connectors.length === 0 ? (
                                    <div className="center-message">No connectors found.</div>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                            gap: "14px",
                                        }}
                                    >
                                        {connectors.map((connector) => {
                                            const isSelected = selectedConnectorId === connector.id;

                                            return (
                                                <button
                                                    key={connector.id}
                                                    type="button"
                                                    onClick={() => handleConnectorSelect(connector.id)}
                                                    style={{
                                                        width: "100%",
                                                        textAlign: "center",
                                                        padding: "18px 16px",
                                                        borderRadius: "16px",
                                                        border: isSelected
                                                            ? "1px solid rgba(114, 183, 255, 0.55)"
                                                            : "1px solid rgba(114, 183, 255, 0.24)",
                                                        background: isSelected
                                                            ? "linear-gradient(180deg, #5da8ff, #3573d1)"
                                                            : "rgba(12, 28, 54, 0.92)",
                                                        color: "#ffffff",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "10px",
                                                        minHeight: "118px",
                                                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.22)",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: "1.05rem",
                                                                lineHeight: 1.2,
                                                                marginBottom: "6px",
                                                            }}
                                                        >
                                                            {connector.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                color: "rgba(255, 255, 255, 0.88)",
                                                                fontSize: "0.95rem",
                                                            }}
                                                        >
                                                            {connector.connector_code}
                                                        </div>
                                                    </div>

                                                    <StatusBadge status={connector.health_status} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </SectionCard>

                            <SectionCard title="Connector Detail">
                                {detail ? (
                                    <>
                                        <div className="data-list">
                                            <div className="data-list__row">
                                                <span className="data-list__label">Name</span>
                                                <span className="data-list__value">{detail.name}</span>
                                            </div>

                                            <div className="data-list__row">
                                                <span className="data-list__label">Code</span>
                                                <span className="data-list__value">{detail.connector_code}</span>
                                            </div>

                                            <div className="data-list__row">
                                                <span className="data-list__label">Status</span>
                                                <StatusBadge status={detail.status} />
                                            </div>

                                            <div className="data-list__row">
                                                <span className="data-list__label">Version</span>
                                                <span className="data-list__value">{detail.version}</span>
                                            </div>

                                            <div className="data-list__row">
                                                <span className="data-list__label">Last Sync</span>
                                                <span className="data-list__value">{detail.last_sync_at}</span>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "12px",
                                                marginTop: "18px",
                                            }}
                                        >
                                            {detail.available_actions.map((actionCode) => (
                                                <button
                                                    key={actionCode}
                                                    type="button"
                                                    className="primary-button"
                                                    onClick={() => handleAction(actionCode)}
                                                >
                                                    {formatActionLabel(actionCode)}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="center-message">Select a connector.</div>
                                )}
                            </SectionCard>

                            <SectionCard title="Connector Health">
                                {health ? (
                                    <div className="data-list">
                                        <div className="data-list__row">
                                            <span className="data-list__label">Health</span>
                                            <StatusBadge status={health.health_status} />
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Success Rate</span>
                                            <span className="data-list__value">
                                                {health.success_rate_percent}%
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Queue Depth</span>
                                            <span className="data-list__value">{health.queue_depth}</span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Last Report</span>
                                            <span className="data-list__value">{health.last_reported_at}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="center-message">No health data.</div>
                                )}
                            </SectionCard>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <SectionCard title="Recent Jobs">
                            {jobs.length === 0 ? (
                                <div className="center-message">No recent jobs found.</div>
                            ) : (
                                <div className="table-shell">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Result</th>
                                                <th>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.map((job) => (
                                                <tr key={job.id}>
                                                    <td>{job.job_type}</td>
                                                    <td>{job.status}</td>
                                                    <td>{job.result_summary}</td>
                                                    <td>{job.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    </div>
                </>
            )}
        </div>
    );
}