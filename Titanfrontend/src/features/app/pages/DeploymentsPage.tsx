import { useEffect, useMemo, useState } from "react";
import { getPlatformDeploymentDetail, getPlatformDeployments } from "../../../api/deployments";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import type { PlatformDeployment, PlatformDeploymentDetail } from "../../../types/deployments";

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

function sortDeployments(items: PlatformDeployment[]) {
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

export default function DeploymentsPage() {
    const { token } = useAuth();

    const [deployments, setDeployments] = useState<PlatformDeployment[]>([]);
    const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
    const [expandedDeploymentId, setExpandedDeploymentId] = useState<number | null>(null);
    const [selectedDeployment, setSelectedDeployment] = useState<PlatformDeploymentDetail | null>(null);
    const [listError, setListError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [isListLoading, setIsListLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function loadDeployments() {
            if (!token) {
                return;
            }

            setIsListLoading(true);
            setListError("");

            try {
                const response = await getPlatformDeployments(token);

                if (!isMounted) {
                    return;
                }

                const sorted = sortDeployments(response);
                setDeployments(sorted);

                const firstDeploymentId = sorted[0]?.id ?? null;
                setSelectedDeploymentId((current) => current ?? firstDeploymentId);
                setExpandedDeploymentId((current) => current ?? firstDeploymentId);
            } catch (error) {
                if (isMounted) {
                    setListError(error instanceof Error ? error.message : "Failed to load deployments.");
                }
            } finally {
                if (isMounted) {
                    setIsListLoading(false);
                }
            }
        }

        void loadDeployments();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        async function loadDeploymentDetail() {
            if (!token || selectedDeploymentId === null) {
                setSelectedDeployment(null);
                return;
            }

            setIsDetailLoading(true);
            setDetailError("");

            try {
                const response = await getPlatformDeploymentDetail(token, selectedDeploymentId);

                if (isMounted) {
                    setSelectedDeployment(response);
                }
            } catch (error) {
                if (isMounted) {
                    setDetailError(error instanceof Error ? error.message : "Failed to load deployment detail.");
                }
            } finally {
                if (isMounted) {
                    setIsDetailLoading(false);
                }
            }
        }

        void loadDeploymentDetail();

        return () => {
            isMounted = false;
        };
    }, [token, selectedDeploymentId]);

    const activeDeploymentCount = useMemo(
        () => deployments.filter((item) => item.status.toLowerCase() === "active").length,
        [deployments],
    );

    const attentionDeploymentCount = useMemo(
        () => deployments.filter((item) => item.health_status.toLowerCase() !== "healthy").length,
        [deployments],
    );

    const customerCount = useMemo(() => {
        return new Set(deployments.map((item) => item.customer_account_id)).size;
    }, [deployments]);

    const totalPages = useMemo(() => {
        return deployments.length === 0 ? 1 : Math.ceil(deployments.length / pageSize);
    }, [deployments.length, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages - 1) {
            setCurrentPage(Math.max(0, totalPages - 1));
        }
    }, [currentPage, totalPages]);

    const pagedDeployments = useMemo(() => {
        const start = currentPage * pageSize;
        return deployments.slice(start, start + pageSize);
    }, [currentPage, deployments, pageSize]);

    function handleToggleExpand(deploymentId: number) {
        setSelectedDeploymentId(deploymentId);
        setDetailError("");

        setExpandedDeploymentId((current) => {
            if (current === deploymentId) {
                return null;
            }

            return deploymentId;
        });
    }

    function handleRowsPerPageChange(nextValue: string) {
        const parsed = Number(nextValue);
        const safeValue = PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 10;
        setPageSize(safeValue);
        setCurrentPage(0);
    }

    const selectedSummary = deployments.find((item) => item.id === selectedDeploymentId) ?? null;

    return (
        <>
            <PageHeader
                title="Deployments"
                subtitle="Review Herra deployments grouped by customer so Titan staff can quickly understand each account’s operational footprint."
            />

            {listError ? <div className="error-banner">{listError}</div> : null}

            <div className="stats-grid">
                <SectionCard title="Deployment Inventory">
                    <div className="metric-line">
                        <span>Total deployments</span>
                        <strong>{deployments.length}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Customers represented</span>
                        <strong>{customerCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Operational Status">
                    <div className="metric-line">
                        <span>Active deployments</span>
                        <strong>{activeDeploymentCount}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Need attention</span>
                        <strong>{attentionDeploymentCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Current Selection">
                    <div className="metric-line">
                        <span>Customer</span>
                        <strong>{selectedDeployment?.customer_account_name ?? "None selected"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Deployment</span>
                        <strong>{selectedDeployment?.name ?? "None selected"}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Latest Seen">
                    <div className="metric-line">
                        <span>Selected last seen</span>
                        <strong>{selectedDeployment ? formatDateTime(selectedDeployment.last_seen_at) : "Not available"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>List status</span>
                        <strong>{isListLoading ? "Refreshing" : "Ready"}</strong>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Customer Deployments">
                {isListLoading ? (
                    <LoadingState message="Loading deployments..." />
                ) : deployments.length === 0 ? (
                    <EmptyState message="No platform deployments were returned." />
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
                                    minWidth: 1320,
                                    display: "grid",
                                    gridTemplateColumns: "60px minmax(220px, 1.4fr) minmax(260px, 1.6fr) 140px 140px 150px 140px 180px 220px",
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
                                    Deployment
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
                                    Environment
                                </div>
                                <div
                                    style={{
                                        padding: "16px 14px",
                                        fontWeight: 700,
                                        color: "var(--titan-text-soft)",
                                        borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                                    }}
                                >
                                    Region
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
                                    Last Seen
                                </div>

                                {pagedDeployments.map((deployment) => {
                                    const isExpanded = expandedDeploymentId === deployment.id;
                                    const isSelected = selectedDeploymentId === deployment.id;
                                    const showExpandedDetail =
                                        isExpanded &&
                                        selectedDeployment !== null &&
                                        selectedDeployment.id === deployment.id &&
                                        !detailError;

                                    return (
                                        <div
                                            key={deployment.id}
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
                                                    onClick={() => handleToggleExpand(deployment.id)}
                                                    aria-label={isExpanded ? "Collapse deployment row" : "Expand deployment row"}
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
                                                title={deployment.customer_account_name}
                                            >
                                                {deployment.customer_account_name}
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
                                                title={deployment.name}
                                            >
                                                {deployment.name}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                }}
                                            >
                                                <StatusBadge status={deployment.status} />
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                }}
                                            >
                                                <StatusBadge status={deployment.health_status} />
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {deployment.environment_type}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {deployment.region}
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
                                                title={deployment.version}
                                            >
                                                {deployment.version}
                                            </div>

                                            <div
                                                style={{
                                                    padding: "14px 14px",
                                                    borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                                                    background: isExpanded ? "rgba(16, 37, 78, 0.32)" : "transparent",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatDateTime(deployment.last_seen_at)}
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
                                                        <LoadingState message="Loading deployment detail..." />
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
                                                                        Deployment Code
                                                                    </div>
                                                                    <div style={{ fontWeight: 700 }}>
                                                                        {selectedDeployment.deployment_code}
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
                                                                        Launch URL
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 700,
                                                                            wordBreak: "break-word",
                                                                        }}
                                                                    >
                                                                        {selectedDeployment.launch_url}
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
                                                                    Recent Deployment Events
                                                                </div>

                                                                {selectedDeployment.events.length === 0 ? (
                                                                    <div
                                                                        style={{
                                                                            color: "var(--titan-text-soft)",
                                                                        }}
                                                                    >
                                                                        No deployment events were returned for this deployment.
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            display: "grid",
                                                                            gap: 10,
                                                                        }}
                                                                    >
                                                                        {selectedDeployment.events.map((event, index) => (
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
                                {getVisibleRangeLabel(deployments.length, pageSize, currentPage)}
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
                                    htmlFor="deployment-page-size"
                                    style={{
                                        color: "var(--titan-text-soft)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Show
                                </label>

                                <select
                                    id="deployment-page-size"
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