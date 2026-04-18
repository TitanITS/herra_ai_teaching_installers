import { useEffect, useMemo, useState } from "react";
import { getPlatformConnectorDetail, getPlatformConnectors } from "../../../api/connectors";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import type { PlatformConnector, PlatformConnectorDetail } from "../../../types/connectors";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function formatDateTime(value: string) {
    if (!value) {
        return "Not available";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
}

function sortConnectors(items: PlatformConnector[]) {
    return [...items].sort((left, right) => {
        const customerComparison = left.customer_account_name.localeCompare(right.customer_account_name);
        if (customerComparison !== 0) {
            return customerComparison;
        }

        return left.name.localeCompare(right.name);
    });
}

function getVisibleRangeLabel(total: number, pageSize: number, currentPage: number) {
    if (total === 0) {
        return "Showing 0 of 0";
    }

    const start = currentPage * pageSize + 1;
    const end = Math.min(total, start + pageSize - 1);
    return `Showing ${start}-${end} of ${total}`;
}

function buildEventKey(event: { id: number; event_type: string; created_at: string }, index: number) {
    return `${event.id}-${event.event_type}-${event.created_at}-${index}`;
}

export default function ConnectorsPage() {
    const { token } = useAuth();

    const [connectors, setConnectors] = useState<PlatformConnector[]>([]);
    const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(null);
    const [expandedConnectorId, setExpandedConnectorId] = useState<number | null>(null);
    const [selectedConnector, setSelectedConnector] = useState<PlatformConnectorDetail | null>(null);
    const [listError, setListError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [isListLoading, setIsListLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function loadConnectors() {
            if (!token) {
                return;
            }

            setIsListLoading(true);
            setListError("");

            try {
                const response = await getPlatformConnectors(token);

                if (!isMounted) {
                    return;
                }

                const sorted = sortConnectors(response);
                setConnectors(sorted);

                const firstConnectorId = sorted[0]?.id ?? null;
                setSelectedConnectorId((current) => current ?? firstConnectorId);
                setExpandedConnectorId((current) => current ?? firstConnectorId);
            } catch (error) {
                if (isMounted) {
                    setListError(error instanceof Error ? error.message : "Failed to load connectors.");
                }
            } finally {
                if (isMounted) {
                    setIsListLoading(false);
                }
            }
        }

        void loadConnectors();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        async function loadConnectorDetail() {
            if (!token || selectedConnectorId === null) {
                setSelectedConnector(null);
                return;
            }

            setIsDetailLoading(true);
            setDetailError("");

            try {
                const response = await getPlatformConnectorDetail(token, selectedConnectorId);

                if (isMounted) {
                    setSelectedConnector(response);
                }
            } catch (error) {
                if (isMounted) {
                    setDetailError(error instanceof Error ? error.message : "Failed to load connector detail.");
                }
            } finally {
                if (isMounted) {
                    setIsDetailLoading(false);
                }
            }
        }

        void loadConnectorDetail();

        return () => {
            isMounted = false;
        };
    }, [token, selectedConnectorId]);

    const activeConnectorCount = useMemo(
        () => connectors.filter((item) => item.status.toLowerCase() === "active").length,
        [connectors],
    );

    const attentionConnectorCount = useMemo(
        () => connectors.filter((item) => item.health_status.toLowerCase() !== "healthy").length,
        [connectors],
    );

    const customerCount = useMemo(() => {
        return new Set(connectors.map((item) => item.customer_account_id)).size;
    }, [connectors]);

    const totalPages = useMemo(() => {
        return connectors.length === 0 ? 1 : Math.ceil(connectors.length / pageSize);
    }, [connectors.length, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages - 1) {
            setCurrentPage(Math.max(0, totalPages - 1));
        }
    }, [currentPage, totalPages]);

    const pagedConnectors = useMemo(() => {
        const start = currentPage * pageSize;
        return connectors.slice(start, start + pageSize);
    }, [currentPage, connectors, pageSize]);

    function handleToggleExpand(connectorId: number) {
        setSelectedConnectorId(connectorId);
        setDetailError("");

        setExpandedConnectorId((current) => {
            if (current === connectorId) {
                return null;
            }

            return connectorId;
        });
    }

    function handleRowsPerPageChange(nextValue: string) {
        const parsed = Number(nextValue);
        const safeValue = PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 10;
        setPageSize(safeValue);
        setCurrentPage(0);
    }

    return (
        <>
            <PageHeader
                title="Connectors"
                subtitle="Review customer integrations grouped by account so Titan staff can quickly assess connector status, health, and sync readiness."
            />

            {listError ? <div className="error-banner">{listError}</div> : null}

            <div className="stats-grid">
                <SectionCard title="Connector Inventory">
                    <div className="metric-line">
                        <span>Total connectors</span>
                        <strong>{connectors.length}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Customers represented</span>
                        <strong>{customerCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Operational Status">
                    <div className="metric-line">
                        <span>Active connectors</span>
                        <strong>{activeConnectorCount}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Need attention</span>
                        <strong>{attentionConnectorCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Current Selection">
                    <div className="metric-line">
                        <span>Customer</span>
                        <strong>{selectedConnector?.customer_account_name ?? "None selected"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Connector</span>
                        <strong>{selectedConnector?.name ?? "None selected"}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Latest Sync">
                    <div className="metric-line">
                        <span>Selected last sync</span>
                        <strong>{selectedConnector ? formatDateTime(selectedConnector.last_sync_at) : "Not available"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>List status</span>
                        <strong>{isListLoading ? "Refreshing" : "Ready"}</strong>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Customer Connectors">
                {isListLoading ? (
                    <LoadingState message="Loading connectors..." />
                ) : connectors.length === 0 ? (
                    <EmptyState message="No platform connectors were returned." />
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        <div
                            style={{
                                overflowX: "auto",
                                border: "1px solid rgba(110, 168, 254, 0.12)",
                                borderRadius: 20,
                                background: "rgba(6, 18, 43, 0.55)",
                            }}
                        >
                            <div
                                style={{
                                    minWidth: 1360,
                                    display: "grid",
                                    gridTemplateColumns:
                                        "60px minmax(220px, 1.4fr) minmax(260px, 1.6fr) 140px 140px 170px 160px 170px 220px",
                                }}
                            >
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                />
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Customer
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Connector
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Status
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Health
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Type
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Sync Mode
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Version
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Last Sync
                                </div>

                                {pagedConnectors.map((connector) => {
                                    const isExpanded = expandedConnectorId === connector.id;
                                    const isSelected = selectedConnectorId === connector.id;
                                    const showExpandedDetail =
                                        isExpanded &&
                                        selectedConnector !== null &&
                                        selectedConnector.id === connector.id &&
                                        !detailError;

                                    return (
                                        <div
                                            key={connector.id}
                                            style={{
                                                display: "contents",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleExpand(connector.id)}
                                                    aria-label={isExpanded ? "Collapse connector row" : "Expand connector row"}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 10,
                                                        border: "1px solid rgba(110, 168, 254, 0.18)",
                                                        background: "rgba(255, 255, 255, 0.02)",
                                                        color: "var(--titan-text)",
                                                        cursor: "pointer",
                                                        fontSize: 18,
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    {isExpanded ? "▾" : "▸"}
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    fontWeight: isSelected ? 700 : 600,
                                                }}
                                                title={connector.customer_account_name}
                                            >
                                                {connector.customer_account_name}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                                title={connector.name}
                                            >
                                                {connector.name}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                }}
                                            >
                                                <StatusBadge status={connector.status} />
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                }}
                                            >
                                                <StatusBadge status={connector.health_status} />
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                                title={connector.connector_type}
                                            >
                                                {connector.connector_type}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {connector.sync_mode}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                                title={connector.version}
                                            >
                                                {connector.version}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatDateTime(connector.last_sync_at)}
                                            </div>

                                            {isExpanded ? (
                                                <div
                                                    style={{
                                                        gridColumn: "1 / -1",
                                                        padding: "18px 18px 22px 18px",
                                                        borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                        background: "rgba(7, 23, 52, 0.58)",
                                                    }}
                                                >
                                                    {isDetailLoading && isSelected ? (
                                                        <LoadingState message="Loading connector detail..." />
                                                    ) : detailError && isSelected ? (
                                                        <div className="error-banner">{detailError}</div>
                                                    ) : showExpandedDetail ? (
                                                        <div style={{ display: "grid", gap: 18 }}>
                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gap: 14,
                                                                    gridTemplateColumns:
                                                                        "repeat(auto-fit, minmax(220px, 1fr))",
                                                                }}
                                                            >
                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: 12,
                                                                            letterSpacing: 0.3,
                                                                            textTransform: "uppercase",
                                                                            color: "var(--titan-text-soft)",
                                                                            marginBottom: 6,
                                                                        }}
                                                                    >
                                                                        Connector Type
                                                                    </div>
                                                                    <div style={{ fontWeight: 700 }}>
                                                                        {selectedConnector.connector_type}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: 12,
                                                                            letterSpacing: 0.3,
                                                                            textTransform: "uppercase",
                                                                            color: "var(--titan-text-soft)",
                                                                            marginBottom: 6,
                                                                        }}
                                                                    >
                                                                        Target System
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 700,
                                                                            wordBreak: "break-word",
                                                                        }}
                                                                    >
                                                                        {selectedConnector.target_system}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: 12,
                                                                            letterSpacing: 0.3,
                                                                            textTransform: "uppercase",
                                                                            color: "var(--titan-text-soft)",
                                                                            marginBottom: 6,
                                                                        }}
                                                                    >
                                                                        Auth Mode
                                                                    </div>
                                                                    <div style={{ fontWeight: 700 }}>
                                                                        {selectedConnector.auth_mode}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        letterSpacing: 0.3,
                                                                        textTransform: "uppercase",
                                                                        color: "var(--titan-text-soft)",
                                                                        marginBottom: 10,
                                                                    }}
                                                                >
                                                                    Recent Connector Events
                                                                </div>

                                                                {selectedConnector.events.length === 0 ? (
                                                                    <div
                                                                        style={{
                                                                            color: "var(--titan-text-soft)",
                                                                        }}
                                                                    >
                                                                        No connector events were returned for this connector.
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            display: "grid",
                                                                            gap: 10,
                                                                        }}
                                                                    >
                                                                        {selectedConnector.events.map((event, index) => (
                                                                            <div
                                                                                key={buildEventKey(event, index)}
                                                                                style={{
                                                                                    display: "grid",
                                                                                    gap: 10,
                                                                                    gridTemplateColumns:
                                                                                        "minmax(180px, 220px) minmax(140px, 160px) minmax(220px, 1fr) minmax(180px, 220px)",
                                                                                    alignItems: "start",
                                                                                    padding: "14px 16px",
                                                                                    border: "1px solid rgba(110, 168, 254, 0.12)",
                                                                                    borderRadius: 16,
                                                                                    background: "rgba(255, 255, 255, 0.02)",
                                                                                    minWidth: 0,
                                                                                }}
                                                                            >
                                                                                <div style={{ minWidth: 0 }}>
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            textTransform: "uppercase",
                                                                                            color: "var(--titan-text-soft)",
                                                                                            marginBottom: 4,
                                                                                        }}
                                                                                    >
                                                                                        Type
                                                                                    </div>
                                                                                    <div
                                                                                        style={{
                                                                                            whiteSpace: "nowrap",
                                                                                            overflow: "hidden",
                                                                                            textOverflow: "ellipsis",
                                                                                        }}
                                                                                        title={event.event_type}
                                                                                    >
                                                                                        {event.event_type}
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            textTransform: "uppercase",
                                                                                            color: "var(--titan-text-soft)",
                                                                                            marginBottom: 4,
                                                                                        }}
                                                                                    >
                                                                                        Severity
                                                                                    </div>
                                                                                    <StatusBadge status={event.severity} />
                                                                                </div>

                                                                                <div style={{ minWidth: 0 }}>
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            textTransform: "uppercase",
                                                                                            color: "var(--titan-text-soft)",
                                                                                            marginBottom: 4,
                                                                                        }}
                                                                                    >
                                                                                        Message
                                                                                    </div>
                                                                                    <div>{event.message}</div>
                                                                                </div>

                                                                                <div>
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize: 12,
                                                                                            textTransform: "uppercase",
                                                                                            color: "var(--titan-text-soft)",
                                                                                            marginBottom: 4,
                                                                                        }}
                                                                                    >
                                                                                        Created
                                                                                    </div>
                                                                                    <div>{formatDateTime(event.created_at)}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div style={{ color: "var(--titan-text-soft)" }}>
                                {getVisibleRangeLabel(connectors.length, pageSize, currentPage)}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <label
                                    htmlFor="connector-page-size"
                                    style={{
                                        color: "var(--titan-text-soft)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Show
                                </label>

                                <select
                                    id="connector-page-size"
                                    value={pageSize}
                                    onChange={(event) => handleRowsPerPageChange(event.target.value)}
                                    style={{
                                        minWidth: 88,
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(110, 168, 254, 0.2)",
                                        background: "rgba(7, 23, 52, 0.82)",
                                        color: "var(--titan-text)",
                                    }}
                                >
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>

                                <span style={{ color: "var(--titan-text-soft)" }}>per page</span>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </button>

                                <span style={{ color: "var(--titan-text-soft)" }}>
                                    Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>
        </>
    );
}