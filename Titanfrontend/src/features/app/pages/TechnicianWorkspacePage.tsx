import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getPlatformCaseDetail, getPlatformMyPageSummary, updatePlatformCaseWorkflow } from "../../../api/cases";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";
import type {
    PlatformCaseDetail,
    PlatformCaseListItem,
    PlatformCaseTimelineEvent,
    PlatformMyPageSummary,
} from "../../../types/cases";

const CASE_STATUS_OPTIONS = ["In Progress", "Customer Pending", "Monitoring", "Escalated", "Resolved"] as const;
const ESCALATION_TARGET_OPTIONS = ["", "Engineer", "Programmer", "Account Manager"] as const;
const MY_PAGE_POLLING_INTERVAL_MS = 10000;

type MyPageLocationState = {
    selectedCaseId?: number;
};

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

function getDisplayCaseNumber(rawValue: string | number | null | undefined) {
    if (rawValue === null || rawValue === undefined) {
        return "";
    }

    return String(rawValue).replace(/^TC[-\s]*/i, "").trim();
}

function sortCases(items: PlatformCaseListItem[]) {
    return [...items].sort((left, right) => {
        const updatedComparison = right.updated_at.localeCompare(left.updated_at);
        if (updatedComparison !== 0) {
            return updatedComparison;
        }
        return right.case_number - left.case_number;
    });
}

function buildActiveTrackedCases(summary: PlatformMyPageSummary) {
    const uniqueCases = new Map<number, PlatformCaseListItem>();

    [
        ...summary.recently_updated_cases,
        ...summary.my_open_cases,
        ...summary.my_escalated_cases,
        ...summary.waiting_on_customer_cases,
    ].forEach((item) => uniqueCases.set(item.id, item));

    return sortCases(Array.from(uniqueCases.values()));
}

function buildArchivedCases(summary: PlatformMyPageSummary) {
    return sortCases(summary.archived_cases);
}

function buildSelectableCases(summary: PlatformMyPageSummary) {
    const uniqueCases = new Map<number, PlatformCaseListItem>();

    [...buildActiveTrackedCases(summary), ...buildArchivedCases(summary)].forEach((item) => {
        uniqueCases.set(item.id, item);
    });

    return sortCases(Array.from(uniqueCases.values()));
}

function buildInitialSelectedCaseId(summary: PlatformMyPageSummary) {
    return buildActiveTrackedCases(summary)[0]?.id ?? buildArchivedCases(summary)[0]?.id ?? null;
}

function getStatusDisplay(status: string) {
    switch (status) {
        case "Assigned":
            return "Assigned";
        case "Customer Pending":
            return "Waiting on Customer";
        default:
            return status;
    }
}

function getTitanStatusPillStyle(status: string): CSSProperties {
    const normalized = status.toLowerCase();

    if (normalized === "resolved" || normalized === "closed") {
        return {
            border: "1px solid rgba(76, 175, 80, 0.28)",
            background: "rgba(76, 175, 80, 0.14)",
            color: "#9ef0aa",
        };
    }

    if (normalized === "customer pending") {
        return {
            border: "1px solid rgba(255, 193, 7, 0.28)",
            background: "rgba(255, 193, 7, 0.12)",
            color: "#ffe08a",
        };
    }

    if (normalized === "escalated") {
        return {
            border: "1px solid rgba(255, 196, 87, 0.35)",
            background: "rgba(255, 196, 87, 0.12)",
            color: "#ffe7a8",
        };
    }

    if (normalized === "monitoring") {
        return {
            border: "1px solid rgba(147, 112, 219, 0.28)",
            background: "rgba(147, 112, 219, 0.14)",
            color: "#d7c0ff",
        };
    }

    return {
        border: "1px solid rgba(93, 168, 255, 0.28)",
        background: "rgba(93, 168, 255, 0.14)",
        color: "#8fc4ff",
    };
}

function getStatusHelperText(status: string) {
    switch (status) {
        case "In Progress":
            return "Titan is actively working on this case.";
        case "Customer Pending":
            return "Titan is waiting for the customer to reply before more work can continue.";
        case "Monitoring":
            return "Titan made a change and is watching for stability.";
        case "Escalated":
            return "Titan moved this case to a higher support queue or specialist.";
        case "Resolved":
        case "Closed":
            return "Titan completed the work and stored this case in the resolved archive.";
        default:
            return "Review the latest case activity below.";
    }
}

function getEscalationBadgeStyle(escalationTarget: string) {
    if (escalationTarget) {
        return {
            border: "1px solid rgba(255, 196, 87, 0.35)",
            background: "rgba(255, 196, 87, 0.12)",
            color: "#ffe7a8",
        };
    }

    return {
        border: "1px solid rgba(110, 168, 254, 0.16)",
        background: "rgba(255, 255, 255, 0.03)",
        color: "var(--titan-text-soft)",
    };
}

function getWorkflowFieldStyle(isEnabled: boolean): CSSProperties {
    return {
        ...selectStyle,
        background: isEnabled ? "rgba(7, 23, 52, 0.82)" : "rgba(7, 23, 52, 0.45)",
        color: isEnabled ? "var(--titan-text)" : "var(--titan-text-soft)",
        cursor: isEnabled ? "pointer" : "not-allowed",
        opacity: isEnabled ? 1 : 0.82,
    };
}

function getTextareaStyle(isEnabled: boolean, minHeight: number): CSSProperties {
    return {
        width: "100%",
        borderRadius: 14,
        border: "1px solid rgba(110, 168, 254, 0.2)",
        background: isEnabled ? "rgba(7, 23, 52, 0.82)" : "rgba(7, 23, 52, 0.45)",
        color: isEnabled ? "var(--titan-text)" : "var(--titan-text-soft)",
        padding: "14px 16px",
        resize: "vertical",
        lineHeight: 1.6,
        minHeight,
        cursor: isEnabled ? "text" : "not-allowed",
        opacity: isEnabled ? 1 : 0.82,
    };
}

function getTimelineHeading(eventItem: PlatformCaseTimelineEvent) {
    const eventType = eventItem.event_type.toLowerCase();
    const actorName = eventItem.actor_name || "System";
    const isInternal = !eventItem.is_customer_visible;

    switch (eventType) {
        case "customer_reply":
            return `${actorName} replied`;
        case "general_notes":
            return `${actorName} posted an update`;
        case "internal_notes":
            return `${actorName} added an internal note`;
        case "status_change":
            return `${actorName} changed the status`;
        case "assignment":
        case "accepted":
        case "reassignment":
            return `${actorName} updated assignment`;
        case "escalation":
        case "escalation_cleared":
            return `${actorName} updated escalation`;
        case "created":
            return "Case opened";
        default:
            return isInternal ? `${actorName} added an internal update` : `${actorName} added an update`;
    }
}

function renderTimelineItem(eventItem: PlatformCaseTimelineEvent) {
    const heading = getTimelineHeading(eventItem);

    return (
        <details
            key={eventItem.id}
            style={{
                border: "1px solid rgba(110, 168, 254, 0.12)",
                borderRadius: 16,
                background: "rgba(255, 255, 255, 0.02)",
                padding: "0 18px 16px",
            }}
        >
            <summary
                style={{
                    listStyle: "none",
                    cursor: "pointer",
                    padding: "16px 0",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto auto",
                        gap: 12,
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 700,
                            minWidth: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {heading}
                    </div>

                    <div style={{ color: "var(--titan-text-soft)", fontSize: 13, whiteSpace: "nowrap" }}>
                        {formatDateTime(eventItem.created_at)}
                    </div>

                    <span style={timelineButtonStyle}>View details</span>
                </div>
            </summary>

            {eventItem.message ? (
                <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, marginTop: 2 }}>
                    {eventItem.message}
                </div>
            ) : null}

            {eventItem.content ? (
                <div
                    style={{
                        border: "1px solid rgba(110, 168, 254, 0.12)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        background: "rgba(7, 23, 52, 0.55)",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        lineHeight: 1.6,
                        marginTop: eventItem.message ? 12 : 2,
                    }}
                >
                    {eventItem.content}
                </div>
            ) : null}
        </details>
    );
}

function CaseTable({
    items,
    selectedCaseId,
    onSelect,
}: {
    items: PlatformCaseListItem[];
    selectedCaseId: number | null;
    onSelect: (caseId: number) => void;
}) {
    return (
        <div
            style={{
                border: "1px solid rgba(110, 168, 254, 0.12)",
                borderRadius: 20,
                background: "rgba(6, 18, 43, 0.55)",
                overflow: "hidden",
            }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.2fr 1.9fr 0.95fr 1fr" }}>
                {["Case Number", "Customer", "Summary", "Status", "Escalation"].map((label) => (
                    <div
                        key={label}
                        style={{
                            padding: "14px 14px",
                            fontWeight: 700,
                            color: "var(--titan-text-soft)",
                            borderBottom: "1px solid rgba(110, 168, 254, 0.12)",
                            background: "rgba(255,255,255,0.02)",
                        }}
                    >
                        {label}
                    </div>
                ))}

                {items.map((item) => {
                    const isSelected = selectedCaseId === item.id;
                    const cellStyle = {
                        padding: "14px 14px",
                        borderBottom: "1px solid rgba(110, 168, 254, 0.08)",
                        background: isSelected ? "rgba(16, 37, 78, 0.32)" : "transparent",
                        color: "var(--titan-text)",
                        minWidth: 0,
                    } as const;

                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onSelect(item.id);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            style={{ display: "contents", cursor: "pointer" }}
                        >
                            <div style={{ ...cellStyle, whiteSpace: "nowrap", fontWeight: 700 }}>
                                {getDisplayCaseNumber(item.shared_case_number || item.case_number)}
                            </div>
                            <div
                                style={{
                                    ...cellStyle,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                                title={item.customer_name}
                            >
                                {item.customer_name}
                            </div>
                            <div
                                style={{
                                    ...cellStyle,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                                title={item.summary}
                            >
                                {item.summary}
                            </div>
                            <div style={cellStyle}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "5px 12px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        ...getTitanStatusPillStyle(item.status),
                                    }}
                                >
                                    {getStatusDisplay(item.status)}
                                </span>
                            </div>
                            <div style={cellStyle}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "5px 12px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        ...getEscalationBadgeStyle(item.escalation_target || ""),
                                    }}
                                >
                                    {item.escalation_target || "None"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function TechnicianWorkspacePage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [summary, setSummary] = useState<PlatformMyPageSummary | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
    const [selectedCase, setSelectedCase] = useState<PlatformCaseDetail | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);

    const [workflowStatus, setWorkflowStatus] = useState("In Progress");
    const [workflowEscalationTarget, setWorkflowEscalationTarget] = useState("");
    const [caseDetailsDraft, setCaseDetailsDraft] = useState("");
    const [generalNotesDraft, setGeneralNotesDraft] = useState("");
    const [internalNotesDraft, setInternalNotesDraft] = useState("");

    const caseDetailsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const selectedCaseIdRef = useRef<number | null>(null);
    const isEditModeRef = useRef(false);

    const selectableCases = useMemo(() => (summary ? buildSelectableCases(summary) : []), [summary]);
    const activeTrackedCases = useMemo(() => (summary ? buildActiveTrackedCases(summary) : []), [summary]);
    const archivedCases = useMemo(() => (summary ? buildArchivedCases(summary) : []), [summary]);

    const locationState = (location.state as MyPageLocationState | null) ?? null;

    useEffect(() => {
        selectedCaseIdRef.current = selectedCaseId;
    }, [selectedCaseId]);

    useEffect(() => {
        isEditModeRef.current = isEditMode;
    }, [isEditMode]);

    const hasAnyUnsavedChanges = useMemo(() => {
        if (!selectedCase) {
            return false;
        }

        return (
            workflowStatus !== selectedCase.status ||
            workflowEscalationTarget !== (selectedCase.escalation_target || "") ||
            caseDetailsDraft !== selectedCase.case_details ||
            generalNotesDraft.trim().length > 0 ||
            internalNotesDraft.trim().length > 0
        );
    }, [
        selectedCase,
        workflowStatus,
        workflowEscalationTarget,
        caseDetailsDraft,
        generalNotesDraft,
        internalNotesDraft,
    ]);

    const syncDraftsFromCase = useCallback((caseDetail: PlatformCaseDetail) => {
        setWorkflowStatus(caseDetail.status);
        setWorkflowEscalationTarget(caseDetail.escalation_target || "");
        setCaseDetailsDraft(caseDetail.case_details || "");
        setGeneralNotesDraft("");
        setInternalNotesDraft("");
    }, []);

    const loadSummary = useCallback(
        async (preferredCaseId?: number | null, showLoading = true) => {
            if (!token) {
                return;
            }

            if (showLoading) {
                setIsSummaryLoading(true);
                setError("");
            }

            try {
                const nextSummary = await getPlatformMyPageSummary(token);
                setSummary(nextSummary);

                const defaultCaseId = buildInitialSelectedCaseId(nextSummary);
                const desiredCaseId = preferredCaseId ?? selectedCaseIdRef.current ?? defaultCaseId;

                if (desiredCaseId && buildSelectableCases(nextSummary).some((item) => item.id === desiredCaseId)) {
                    setSelectedCaseId(desiredCaseId);
                } else {
                    setSelectedCaseId(defaultCaseId);
                }
            } catch (loadError) {
                console.error(loadError);
                setError("We could not load your case workspace.");
            } finally {
                if (showLoading) {
                    setIsSummaryLoading(false);
                }
            }
        },
        [token],
    );

    const loadCaseDetail = useCallback(
        async (caseId: number) => {
            if (!token) {
                return;
            }

            setIsDetailLoading(true);

            try {
                const caseDetail = await getPlatformCaseDetail(token, caseId);
                setSelectedCase(caseDetail);

                if (!isEditModeRef.current) {
                    syncDraftsFromCase(caseDetail);
                }
            } catch (detailError) {
                console.error(detailError);
                setError("We could not load the selected case.");
            } finally {
                setIsDetailLoading(false);
            }
        },
        [syncDraftsFromCase, token],
    );

    useEffect(() => {
        void loadSummary(locationState?.selectedCaseId, true);
    }, [loadSummary, locationState?.selectedCaseId]);

    useEffect(() => {
        if (selectedCaseId) {
            void loadCaseDetail(selectedCaseId);
        } else {
            setSelectedCase(null);
        }
    }, [loadCaseDetail, selectedCaseId]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void loadSummary(undefined, false);
        }, MY_PAGE_POLLING_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [loadSummary, token]);

    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage("");
        }, 3500);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    function handleSelectCase(caseId: number) {
        setSelectedCaseId(caseId);
    }

    function handleStartEdit() {
        if (!selectedCase) {
            return;
        }

        syncDraftsFromCase(selectedCase);
        setIsEditMode(true);
    }

    function handleCancelEdit() {
        if (!selectedCase) {
            return;
        }

        syncDraftsFromCase(selectedCase);
        setIsEditMode(false);
    }

    async function handleSaveAll() {
        if (!token || !selectedCase || !hasAnyUnsavedChanges) {
            return;
        }

        setIsSavingAll(true);
        setError("");
        setSuccessMessage("");

        try {
            await updatePlatformCaseWorkflow(token, selectedCase.id, {
                status: workflowStatus,
                escalation_target: workflowStatus === "Escalated" ? workflowEscalationTarget : "",
                case_details: caseDetailsDraft,
                general_notes: generalNotesDraft,
                internal_notes: internalNotesDraft,
            });

            await loadSummary(selectedCase.id, false);
            await loadCaseDetail(selectedCase.id);

            setIsEditMode(false);
            setSuccessMessage("Case update saved.");
        } catch (saveError) {
            console.error(saveError);
            setError("We could not save the case update.");
        } finally {
            setIsSavingAll(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Technician Workspace"
                subtitle="Review your active cases, update workflow details, and keep the customer timeline clear and organized."
            />

            {successMessage ? <div className="success-banner">{successMessage}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            {isSummaryLoading || !summary ? (
                <LoadingState message="Loading case workspace..." />
            ) : (
                <>
                    <div className="two-column-grid">
                        <SectionCard title="My Open Cases">
                            {summary.my_open_cases.length === 0 ? (
                                <EmptyState message="You do not have any active assigned cases right now." />
                            ) : (
                                <CaseTable
                                    items={summary.my_open_cases}
                                    selectedCaseId={selectedCaseId}
                                    onSelect={handleSelectCase}
                                />
                            )}
                        </SectionCard>

                        <SectionCard title="Escalations">
                            {summary.my_escalated_cases.length === 0 ? (
                                <EmptyState message="No escalated cases are in your queue right now." />
                            ) : (
                                <CaseTable
                                    items={summary.my_escalated_cases}
                                    selectedCaseId={selectedCaseId}
                                    onSelect={handleSelectCase}
                                />
                            )}
                        </SectionCard>

                        <SectionCard title="Waiting on Customer">
                            {summary.waiting_on_customer_cases.length === 0 ? (
                                <EmptyState message="No cases are currently waiting on a customer reply." />
                            ) : (
                                <CaseTable
                                    items={summary.waiting_on_customer_cases}
                                    selectedCaseId={selectedCaseId}
                                    onSelect={handleSelectCase}
                                />
                            )}
                        </SectionCard>

                        <SectionCard title="Resolved Cases Archive">
                            {summary.archived_cases.length === 0 ? (
                                <EmptyState message="Resolved cases from your workload will appear here." />
                            ) : (
                                <CaseTable
                                    items={summary.archived_cases}
                                    selectedCaseId={selectedCaseId}
                                    onSelect={handleSelectCase}
                                />
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard title="Case Details">
                        {isDetailLoading ? (
                            <LoadingState message="Loading case details..." />
                        ) : selectedCase ? (
                            <div style={{ display: "grid", gap: 18 }}>
                                {selectedCase.escalation_target ? (
                                    <div
                                        style={{
                                            border: "1px solid rgba(255, 196, 87, 0.35)",
                                            background: "rgba(255, 196, 87, 0.12)",
                                            borderRadius: 14,
                                            padding: "15px 16px",
                                            display: "grid",
                                            gap: 6,
                                        }}
                                    >
                                        <div style={{ fontSize: 12, textTransform: "uppercase", color: "#ffe7a8" }}>
                                            Escalation Active
                                        </div>
                                        <div style={{ fontWeight: 700 }}>Target: {selectedCase.escalation_target}</div>
                                        <div style={{ color: "var(--titan-text)" }}>
                                            This case has been escalated and will move into the selected escalation queue when saved.
                                        </div>
                                    </div>
                                ) : null}

                                {selectedCase.status === "Resolved" || selectedCase.status === "Closed" ? (
                                    <div
                                        style={{
                                            border: "1px solid rgba(76, 175, 80, 0.28)",
                                            background: "rgba(76, 175, 80, 0.1)",
                                            borderRadius: 14,
                                            padding: "15px 16px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div style={{ fontWeight: 700 }}>Resolved Case</div>
                                        <div style={{ color: "var(--titan-text-soft)" }}>
                                            This case is resolved and kept here for reference instead of the active My Cases list.
                                        </div>
                                    </div>
                                ) : null}

                                <div
                                    style={{
                                        border: "1px solid rgba(110, 168, 254, 0.12)",
                                        borderRadius: 14,
                                        padding: "16px 18px",
                                        background: "rgba(255,255,255,0.02)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                            Current Case
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: "1.04rem" }}>
                                            {getDisplayCaseNumber(selectedCase.shared_case_number || selectedCase.case_number)}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                padding: "5px 12px",
                                                borderRadius: 999,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                ...getTitanStatusPillStyle(selectedCase.status),
                                            }}
                                        >
                                            {getStatusDisplay(selectedCase.status)}
                                        </span>
                                        <span style={{ color: "var(--titan-text-soft)", fontSize: 13 }}>
                                            Updated {formatDateTime(selectedCase.updated_at)}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                                    <HeaderField
                                        label="Case Number"
                                        value={getDisplayCaseNumber(selectedCase.shared_case_number || selectedCase.case_number)}
                                    />
                                    <div>
                                        <div style={headerLabelStyle}>Customer</div>
                                        <div style={{ fontWeight: 700 }}>
                                            <Link to="/customers" style={{ color: "var(--titan-accent)" }}>
                                                {selectedCase.customer_name}
                                            </Link>
                                        </div>
                                    </div>
                                    <HeaderField label="Assigned To" value={selectedCase.assigned_to_name || "Unassigned"} />
                                    <HeaderField label="Priority" value={selectedCase.priority} />
                                    <HeaderField label="Issue Type" value={selectedCase.issue_type} />
                                    <HeaderField
                                        label="Submitted By"
                                        value={selectedCase.submitted_by_type === "Staff" ? "Titan Staff" : "Customer"}
                                    />
                                    <HeaderField label="Created By" value={selectedCase.created_by_name} />
                                    <HeaderField label="Escalation Target" value={selectedCase.escalation_target || "None"} />
                                </div>

                                <div style={panelStyle}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            alignItems: "center",
                                            marginBottom: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div style={panelTitleStyle}>Workflow and Case Details</div>

                                        {isEditMode ? (
                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    className="primary-button"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSavingAll}
                                                    style={cancelButtonStyle}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="primary-button"
                                                    onClick={() => void handleSaveAll()}
                                                    disabled={isSavingAll || !hasAnyUnsavedChanges}
                                                >
                                                    {isSavingAll ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="primary-button"
                                                onClick={handleStartEdit}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.55, marginBottom: 12 }}>
                                        {getStatusHelperText(selectedCase.status)}
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gap: 14,
                                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                        }}
                                    >
                                        <div>
                                            <label style={fieldLabelStyle}>Case Status</label>
                                            <select
                                                value={workflowStatus}
                                                onChange={(event) => setWorkflowStatus(event.target.value)}
                                                disabled={!isEditMode}
                                                style={getWorkflowFieldStyle(isEditMode)}
                                            >
                                                {CASE_STATUS_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={fieldLabelStyle}>Escalation Target</label>
                                            <select
                                                value={workflowStatus === "Escalated" ? workflowEscalationTarget : ""}
                                                onChange={(event) => setWorkflowEscalationTarget(event.target.value)}
                                                disabled={!isEditMode || workflowStatus !== "Escalated"}
                                                style={getWorkflowFieldStyle(isEditMode && workflowStatus === "Escalated")}
                                            >
                                                {ESCALATION_TARGET_OPTIONS.map((option) => (
                                                    <option key={option || "none"} value={option}>
                                                        {option || "None"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <ReadOnlyPanel title="Summary">{selectedCase.summary}</ReadOnlyPanel>

                                    <div style={{ marginTop: 16 }}>
                                        <div style={panelTitleStyle}>Case Details</div>
                                        {isEditMode ? (
                                            <textarea
                                                ref={caseDetailsTextareaRef}
                                                value={caseDetailsDraft}
                                                onChange={(event) => {
                                                    setCaseDetailsDraft(event.target.value);
                                                }}
                                                rows={12}
                                                style={getTextareaStyle(true, 280)}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    ...readOnlyPanelStyle,
                                                    whiteSpace: "pre-wrap",
                                                    overflowWrap: "anywhere",
                                                    minHeight: 120,
                                                }}
                                            >
                                                {selectedCase.case_details}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={panelStyle}>
                                    <div style={panelTitleStyle}>General Notes</div>
                                    <textarea
                                        value={generalNotesDraft}
                                        onChange={(event) => {
                                            setGeneralNotesDraft(event.target.value);
                                        }}
                                        rows={6}
                                        disabled={!isEditMode}
                                        style={getTextareaStyle(isEditMode, 150)}
                                        placeholder={isEditMode ? "Add general notes to save with this case update." : ""}
                                    />
                                </div>

                                <div style={panelStyle}>
                                    <div style={panelTitleStyle}>Internal Notes</div>
                                    <textarea
                                        value={internalNotesDraft}
                                        onChange={(event) => {
                                            setInternalNotesDraft(event.target.value);
                                        }}
                                        rows={6}
                                        disabled={!isEditMode}
                                        style={getTextareaStyle(isEditMode, 150)}
                                        placeholder={isEditMode ? "Add internal-only notes to save with this case update." : ""}
                                    />
                                </div>

                                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                                    <HeaderField label="Created At" value={formatDateTime(selectedCase.created_at)} />
                                    <HeaderField label="Updated At" value={formatDateTime(selectedCase.updated_at)} />
                                </div>

                                <div style={{ display: "grid", gap: 10 }}>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <div style={{ fontWeight: 700 }}>Case Timeline</div>
                                        <div style={{ color: "var(--titan-text-soft)", fontSize: "0.92rem" }}>
                                            Newest updates appear first. Open any update to read the full entry.
                                        </div>
                                    </div>
                                    {selectedCase.case_events.length === 0 ? (
                                        <EmptyState message="No case updates have been saved yet." />
                                    ) : (
                                        selectedCase.case_events.map((eventItem) => renderTimelineItem(eventItem))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <EmptyState message="Choose a case from the table to review and edit it." />
                        )}
                    </SectionCard>
                </>
            )}
        </>
    );
}

function HeaderField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={headerLabelStyle}>{label}</div>
            <div style={{ fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function ReadOnlyPanel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div style={readOnlyPanelStyle}>
            <div style={panelTitleStyle}>{title}</div>
            <div>{children}</div>
        </div>
    );
}

const headerLabelStyle: CSSProperties = {
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "var(--titan-text-soft)",
    marginBottom: 6,
};

const fieldLabelStyle: CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontSize: 12,
    textTransform: "uppercase",
    color: "var(--titan-text-soft)",
};

const panelStyle: CSSProperties = {
    border: "1px solid rgba(110, 168, 254, 0.12)",
    borderRadius: 14,
    padding: "15px 16px",
    background: "rgba(255, 255, 255, 0.02)",
};

const readOnlyPanelStyle: CSSProperties = {
    border: "1px solid rgba(110, 168, 254, 0.12)",
    borderRadius: 14,
    padding: "15px 16px",
    background: "rgba(7, 23, 52, 0.4)",
};

const panelTitleStyle: CSSProperties = {
    fontSize: 12,
    textTransform: "uppercase",
    color: "var(--titan-text-soft)",
    marginBottom: 8,
};

const selectStyle: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(110, 168, 254, 0.2)",
    background: "rgba(7, 23, 52, 0.82)",
    color: "var(--titan-text)",
};

const cancelButtonStyle: CSSProperties = {
    borderRadius: 999,
    minHeight: 44,
    padding: "0 20px",
};

const timelineButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(110, 168, 254, 0.2)",
    background: "rgba(7, 23, 52, 0.7)",
    color: "var(--titan-text)",
    fontWeight: 700,
    whiteSpace: "nowrap",
};