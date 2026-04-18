import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    addCustomerSupportCaseReply,
    createCustomerSupportCase,
    getCustomerSupportCases,
    getCustomerSupportResources,
} from "../../../api/support";
import type { SupportCase, SupportResources, SupportTimelineEntry } from "../../../types/support";

const SUPPORT_POLLING_INTERVAL_MS = 10000;

const fieldWrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const fieldLabelStyle: React.CSSProperties = {
    color: "var(--titan-text)",
    fontWeight: 600,
    fontSize: "0.95rem",
};

const fieldInputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "46px",
    padding: "0 14px",
    borderRadius: "14px",
    border: "1px solid rgba(114, 183, 255, 0.25)",
    background: "rgba(12, 28, 54, 0.96)",
    color: "#ffffff",
    outline: "none",
};

function getDisplayCaseNumber(rawValue: string | number | null | undefined) {
    if (rawValue === null || rawValue === undefined) {
        return "";
    }

    return String(rawValue).replace(/^TC[-\s]*/i, "").trim();
}

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

function getSeverityPillStyle(level: string): React.CSSProperties {
    const normalized = level.toLowerCase();

    if (normalized === "high") {
        return {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            background: "rgba(255, 82, 82, 0.14)",
            color: "#ff9494",
            border: "1px solid rgba(255, 82, 82, 0.28)",
            fontWeight: 700,
        };
    }

    if (normalized === "medium") {
        return {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            background: "rgba(255, 193, 7, 0.14)",
            color: "#ffdb73",
            border: "1px solid rgba(255, 193, 7, 0.28)",
            fontWeight: 700,
        };
    }

    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "32px",
        padding: "0 12px",
        borderRadius: "999px",
        background: "rgba(76, 175, 80, 0.14)",
        color: "#7ce38b",
        border: "1px solid rgba(76, 175, 80, 0.28)",
        fontWeight: 700,
    };
}

function getCustomerStatusLabel(status: string) {
    switch (status) {
        case "New":
            return "Open";
        case "In Progress":
            return "Titan Working";
        case "Customer Pending":
            return "Waiting on You";
        case "Monitoring":
            return "Monitoring";
        case "Escalated":
            return "Escalated";
        case "Resolved":
        case "Closed":
            return "Resolved";
        default:
            return status;
    }
}

function getStatusPillStyle(status: string): React.CSSProperties {
    const normalized = status.toLowerCase();

    if (normalized === "resolved" || normalized === "closed") {
        return {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            background: "rgba(76, 175, 80, 0.14)",
            color: "#7ce38b",
            border: "1px solid rgba(76, 175, 80, 0.28)",
            fontWeight: 700,
        };
    }

    if (normalized === "customer pending") {
        return {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            background: "rgba(255, 193, 7, 0.14)",
            color: "#ffdb73",
            border: "1px solid rgba(255, 193, 7, 0.28)",
            fontWeight: 700,
        };
    }

    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "32px",
        padding: "0 12px",
        borderRadius: "999px",
        background: "rgba(93, 168, 255, 0.14)",
        color: "#8fc4ff",
        border: "1px solid rgba(93, 168, 255, 0.28)",
        fontWeight: 700,
    };
}

function getStatusHelperText(status: string) {
    switch (status) {
        case "New":
            return "Your case has been received and is waiting for Titan review.";
        case "In Progress":
            return "Titan is actively working on this case.";
        case "Customer Pending":
            return "Titan needs a reply from your team before work can continue.";
        case "Monitoring":
            return "Titan made a change and is monitoring the results.";
        case "Escalated":
            return "Titan moved this case to a higher-priority queue or specialist.";
        case "Resolved":
        case "Closed":
            return "Titan completed the work and stored this case in your resolved archive.";
        default:
            return "Review the latest case activity below.";
    }
}

function getTimelineHeading(entry: SupportTimelineEntry) {
    const authorType = entry.author_type.toLowerCase();
    const authorName = entry.author_name || "Titan";

    if (authorType === "customer") {
        return authorName.toLowerCase().includes("customer") ? "You replied" : `${authorName} replied`;
    }

    if (authorName.toLowerCase().includes("system")) {
        return "Titan updated the status";
    }

    return `${authorName} posted an update`;
}

function getTimelineDetailMessage(entry: SupportTimelineEntry) {
    const message = entry.message.trim();

    if (!message) {
        return "";
    }

    if (message === "Customer replied. Status changed from Customer Pending to In Progress.") {
        return "Your reply was received and Titan moved the case back into active work.";
    }

    return message;
}

function hasTimelineDetails(entry: SupportTimelineEntry) {
    return Boolean(getTimelineDetailMessage(entry));
}

function TimelineEntryCard({ entry }: { entry: SupportTimelineEntry }) {
    const heading = getTimelineHeading(entry);
    const detailMessage = getTimelineDetailMessage(entry);
    const hasDetails = hasTimelineDetails(entry);

    if (!hasDetails) {
        return (
            <div
                style={{
                    border: "1px solid rgba(114, 183, 255, 0.16)",
                    borderRadius: "14px",
                    background: "rgba(12, 28, 54, 0.82)",
                    padding: "16px 18px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
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
                    <div style={{ color: "var(--titan-text-soft)", fontSize: "0.92rem", whiteSpace: "nowrap" }}>
                        {formatDateTime(entry.created_at)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <details
            style={{
                border: "1px solid rgba(114, 183, 255, 0.16)",
                borderRadius: "14px",
                background: "rgba(12, 28, 54, 0.82)",
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

                    <div
                        style={{
                            color: "var(--titan-text-soft)",
                            fontSize: "0.92rem",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formatDateTime(entry.created_at)}
                    </div>

                    <span style={timelineButtonStyle}>View details</span>
                </div>
            </summary>

            <div
                style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.6,
                    marginTop: 2,
                    color: "var(--titan-text-soft)",
                }}
            >
                {detailMessage}
            </div>
        </details>
    );
}

function CaseListCard({
    supportCase,
    isSelected,
    onSelect,
}: {
    supportCase: SupportCase;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            style={{
                width: "100%",
                textAlign: "left",
                padding: "16px 18px",
                borderRadius: "14px",
                border: isSelected ? "1px solid rgba(114, 183, 255, 0.45)" : "1px solid rgba(114, 183, 255, 0.18)",
                background: isSelected ? "rgba(19, 46, 91, 0.75)" : "rgba(12, 28, 54, 0.72)",
                color: "#ffffff",
                cursor: "pointer",
                display: "grid",
                gap: 12,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{getDisplayCaseNumber(supportCase.case_number)}</div>
                <span style={getStatusPillStyle(supportCase.status)}>{getCustomerStatusLabel(supportCase.status)}</span>
            </div>

            <div style={{ color: "var(--titan-text-soft)", fontSize: "0.95rem" }}>
                Status updated {formatDateTime(supportCase.updated_at)}
            </div>
        </button>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                border: "1px solid rgba(110, 168, 254, 0.12)",
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                padding: "13px 15px",
                display: "grid",
                gap: 8,
            }}
        >
            <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>{label}</div>
            <div style={{ fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function QuickHelpArticleCard({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div
            style={{
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(114, 183, 255, 0.16)",
                background: "rgba(12, 28, 54, 0.68)",
                display: "grid",
                gap: 6,
            }}
        >
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.55 }}>{description}</div>
        </div>
    );
}

export default function SupportPage() {
    const { token } = useAuth();

    const [cases, setCases] = useState<SupportCase[]>([]);
    const [resources, setResources] = useState<SupportResources | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
    const [subject, setSubject] = useState("Connector question");
    const [severity, setSeverity] = useState("Medium");
    const [summary, setSummary] = useState("Please help us confirm the next recommended action for a connector warning.");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [replyDraft, setReplyDraft] = useState("");
    const [isReplySubmitting, setIsReplySubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [activityMessage, setActivityMessage] = useState<string>("");

    const selectedCase = useMemo(
        () => cases.find((item) => item.id === selectedCaseId) ?? null,
        [cases, selectedCaseId],
    );

    const selectedCaseRef = useRef<SupportCase | null>(null);
    const selectedCaseIdRef = useRef<number | null>(null);
    const replyDraftRef = useRef("");
    const subjectRef = useRef(subject);
    const summaryRef = useRef(summary);

    useEffect(() => {
        selectedCaseRef.current = selectedCase;
    }, [selectedCase]);

    useEffect(() => {
        selectedCaseIdRef.current = selectedCaseId;
    }, [selectedCaseId]);

    useEffect(() => {
        replyDraftRef.current = replyDraft;
    }, [replyDraft]);

    useEffect(() => {
        subjectRef.current = subject;
    }, [subject]);

    useEffect(() => {
        summaryRef.current = summary;
    }, [summary]);

    const selectedCaseIsReplyLocked = selectedCase ? ["Resolved", "Closed"].includes(selectedCase.status) : true;
    const openCases = useMemo(() => cases.filter((item) => !["Resolved", "Closed"].includes(item.status)), [cases]);
    const resolvedCases = useMemo(() => cases.filter((item) => ["Resolved", "Closed"].includes(item.status)), [cases]);

    const loadData = useCallback(
        async (preferredCaseId?: number | null, showLoading = true) => {
            if (!token) {
                return;
            }

            if (showLoading) {
                setIsLoading(true);
                setError("");
            }

            try {
                const [caseData, resourceData] = await Promise.all([
                    getCustomerSupportCases(token),
                    getCustomerSupportResources(token),
                ]);

                const sortedCases = [...caseData].sort((left, right) => {
                    if (left.updated_at === right.updated_at) {
                        return right.id - left.id;
                    }
                    return left.updated_at < right.updated_at ? 1 : -1;
                });

                setResources(resourceData);

                setCases((currentCases) => {
                    const targetId = preferredCaseId ?? selectedCaseIdRef.current;
                    const existingSelectedCase = currentCases.find((item) => item.id === targetId);
                    const latestSelectedCase = sortedCases.find((item) => item.id === targetId);

                    const hasReplyDraft = replyDraftRef.current.trim().length > 0;
                    const hasCreateDraft =
                        subjectRef.current.trim().length > 0 || summaryRef.current.trim().length > 0;

                    const shouldFreezeSelectedCase =
                        hasReplyDraft &&
                        latestSelectedCase &&
                        existingSelectedCase?.id === latestSelectedCase.id;

                    const nextCases = sortedCases.map((item) => {
                        if (shouldFreezeSelectedCase && item.id === latestSelectedCase.id && existingSelectedCase) {
                            return existingSelectedCase;
                        }
                        return item;
                    });

                    if (
                        !showLoading &&
                        shouldFreezeSelectedCase &&
                        existingSelectedCase &&
                        latestSelectedCase &&
                        existingSelectedCase.updated_at !== latestSelectedCase.updated_at
                    ) {
                        setActivityMessage("New case activity was received in the background. Your reply draft was kept.");
                    }

                    if (!showLoading && hasCreateDraft && currentCases.length > 0 && sortedCases.length > 0) {
                        const newestCurrent = currentCases[0];
                        const newestIncoming = sortedCases[0];
                        if (newestCurrent.updated_at !== newestIncoming.updated_at) {
                            setActivityMessage("New case activity was received in the background. Your case draft was kept.");
                        }
                    }

                    return nextCases;
                });

                setSelectedCaseId((current) => {
                    const desiredId = preferredCaseId ?? current;
                    if (desiredId && sortedCases.some((item) => item.id === desiredId)) {
                        return desiredId;
                    }
                    return sortedCases[0]?.id ?? null;
                });
            } catch (loadError) {
                console.error(loadError);
                setError("We could not load your support workspace right now.");
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        },
        [token],
    );

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void loadData(undefined, false);
        }, SUPPORT_POLLING_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [loadData, token]);

    useEffect(() => {
        if (!activityMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setActivityMessage("");
        }, 4500);

        return () => window.clearTimeout(timeoutId);
    }, [activityMessage]);

    async function handleCreateCase(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token) {
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            const createdCase = await createCustomerSupportCase(token, {
                subject: subject.trim(),
                severity,
                summary: summary.trim(),
            });

            setSubject("Connector question");
            setSeverity("Medium");
            setSummary("Please help us confirm the next recommended action for a connector warning.");
            setMessage(`Case ${getDisplayCaseNumber(createdCase.case.case_number)} was created successfully.`);
            await loadData(createdCase.case.id, false);
        } catch (createError) {
            console.error(createError);
            setError("We could not create your case. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleReplySubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token || !selectedCase || !replyDraft.trim()) {
            return;
        }

        setIsReplySubmitting(true);
        setMessage("");
        setError("");

        try {
            await addCustomerSupportCaseReply(token, selectedCase.id, {
                message: replyDraft.trim(),
            });
            setReplyDraft("");
            setMessage("Your reply was sent to Titan.");
            await loadData(selectedCase.id, false);
        } catch (replyError) {
            console.error(replyError);
            setError("We could not send your reply. Please try again.");
        } finally {
            setIsReplySubmitting(false);
        }
    }

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Support"
                subtitle="Open support cases, track progress, and reply when Titan needs more information from your team."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
            {activityMessage ? <div className="success-banner">{activityMessage}</div> : null}

            {isLoading ? (
                <div className="center-message">Loading your support workspace...</div>
            ) : (
                <>
                    <div className="content-grid content-grid--2">
                        <SectionCard title="Open a Support Case">
                            <form
                                onSubmit={handleCreateCase}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "18px",
                                }}
                            >
                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Subject</span>
                                    <input
                                        style={fieldInputStyle}
                                        type="text"
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        required
                                    />
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Severity</span>
                                    <select
                                        style={fieldInputStyle}
                                        value={severity}
                                        onChange={(event) => setSeverity(event.target.value)}
                                    >
                                        <option value="Low" style={{ background: "#0c1c36", color: "#ffffff" }}>
                                            Low
                                        </option>
                                        <option value="Medium" style={{ background: "#0c1c36", color: "#ffffff" }}>
                                            Medium
                                        </option>
                                        <option value="High" style={{ background: "#0c1c36", color: "#ffffff" }}>
                                            High
                                        </option>
                                    </select>
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Summary</span>
                                    <textarea
                                        style={{
                                            ...fieldInputStyle,
                                            minHeight: "132px",
                                            padding: "14px",
                                            resize: "vertical",
                                            lineHeight: 1.6,
                                        }}
                                        value={summary}
                                        onChange={(event) => setSummary(event.target.value)}
                                        required
                                    />
                                </label>

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button className="primary-button" type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Case"}
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                        <SectionCard title="Support Contacts and Guidance">
                            {resources ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                                    <div
                                        style={{
                                            padding: "16px 18px",
                                            borderRadius: "14px",
                                            border: "1px solid rgba(114, 183, 255, 0.18)",
                                            background: "rgba(12, 28, 54, 0.62)",
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: "8px" }}>Need Urgent Help?</div>
                                        <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.6 }}>
                                            {resources.support_contact.urgent_message}
                                        </div>
                                    </div>

                                    <div className="data-list">
                                        <div className="data-list__row">
                                            <span className="data-list__label">Support Email</span>
                                            <span className="data-list__value">{resources.support_contact.email}</span>
                                        </div>
                                        <div className="data-list__row">
                                            <span className="data-list__label">Support Phone</span>
                                            <span className="data-list__value">{resources.support_contact.phone}</span>
                                        </div>
                                        <div className="data-list__row">
                                            <span className="data-list__label">Support Hours</span>
                                            <span className="data-list__value">{resources.support_contact.hours}</span>
                                        </div>
                                        <div className="data-list__row">
                                            <span className="data-list__label">Account Manager</span>
                                            <span className="data-list__value">{resources.account_manager.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Severity Guidance</div>
                                        <div style={{ display: "grid", gap: "10px" }}>
                                            {resources.severity_guidance.map((item) => (
                                                <div
                                                    key={item.level}
                                                    style={{
                                                        padding: "12px 14px",
                                                        borderRadius: "14px",
                                                        border: "1px solid rgba(114, 183, 255, 0.16)",
                                                        background: "rgba(12, 28, 54, 0.72)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "12px",
                                                            flexWrap: "wrap",
                                                            marginBottom: "8px",
                                                        }}
                                                    >
                                                        <span style={getSeverityPillStyle(item.level)}>{item.level}</span>
                                                        <span style={{ color: "var(--titan-text-soft)" }}>
                                                            {item.response_target}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.5 }}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Quick Help Articles</div>
                                        <div style={{ display: "grid", gap: "10px" }}>
                                            {resources.quick_help_articles.map((article) => (
                                                <QuickHelpArticleCard
                                                    key={article.id}
                                                    title={article.title}
                                                    description={article.description}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </SectionCard>
                    </div>

                    <div className="content-grid content-grid--2">
                        <SectionCard title="Active Cases">
                            {openCases.length === 0 ? (
                                <div className="center-message">You do not have any active support cases right now.</div>
                            ) : (
                                <div style={{ display: "grid", gap: "12px" }}>
                                    {openCases.map((supportCase) => (
                                        <CaseListCard
                                            key={supportCase.id}
                                            supportCase={supportCase}
                                            isSelected={supportCase.id === selectedCaseId}
                                            onSelect={() => setSelectedCaseId(supportCase.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard title="Resolved Cases Archive">
                            {resolvedCases.length === 0 ? (
                                <div className="center-message">Resolved cases will appear here after Titan finishes the work.</div>
                            ) : (
                                <div style={{ display: "grid", gap: "12px" }}>
                                    {resolvedCases.map((supportCase) => (
                                        <CaseListCard
                                            key={supportCase.id}
                                            supportCase={supportCase}
                                            isSelected={supportCase.id === selectedCaseId}
                                            onSelect={() => setSelectedCaseId(supportCase.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard title="Case Details">
                        {selectedCase ? (
                            <div style={{ display: "grid", gap: 18 }}>
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
                                            {getDisplayCaseNumber(selectedCase.case_number)}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <span style={getStatusPillStyle(selectedCase.status)}>
                                            {getCustomerStatusLabel(selectedCase.status)}
                                        </span>
                                        <span style={{ color: "var(--titan-text-soft)", fontSize: 13 }}>
                                            Updated {formatDateTime(selectedCase.updated_at)}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                                    <DetailField label="Case Number" value={getDisplayCaseNumber(selectedCase.case_number)} />
                                    <DetailField label="Status" value={getCustomerStatusLabel(selectedCase.status)} />
                                    <DetailField label="Severity" value={selectedCase.severity} />
                                    <DetailField label="Assigned Team" value={selectedCase.assigned_team || "Titan Support"} />
                                    <DetailField label="Created" value={formatDateTime(selectedCase.created_at)} />
                                    <DetailField label="Updated" value={formatDateTime(selectedCase.updated_at)} />
                                </div>

                                <div
                                    style={{
                                        padding: "15px 16px",
                                        borderRadius: "14px",
                                        border: "1px solid rgba(114, 183, 255, 0.16)",
                                        background: "rgba(12, 28, 54, 0.62)",
                                        display: "grid",
                                        gap: 8,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                        <div style={{ fontWeight: 700 }}>{selectedCase.subject}</div>
                                        <span style={getStatusPillStyle(selectedCase.status)}>{getCustomerStatusLabel(selectedCase.status)}</span>
                                    </div>
                                    <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.55 }}>
                                        {getStatusHelperText(selectedCase.status)}
                                    </div>
                                    <div style={{ color: "var(--titan-text-soft)", lineHeight: 1.55 }}>{selectedCase.summary}</div>
                                </div>

                                {selectedCase.status === "Resolved" || selectedCase.status === "Closed" ? (
                                    <div
                                        style={{
                                            border: "1px solid rgba(76, 175, 80, 0.28)",
                                            background: "rgba(76, 175, 80, 0.1)",
                                            borderRadius: 14,
                                            padding: "14px 16px",
                                            color: "var(--titan-text)",
                                        }}
                                    >
                                        This case is resolved and stored in your resolved archive for future reference.
                                    </div>
                                ) : null}

                                {selectedCase.status === "Customer Pending" ? (
                                    <div
                                        style={{
                                            border: "1px solid rgba(255, 193, 7, 0.45)",
                                            background: "rgba(255, 193, 7, 0.18)",
                                            borderRadius: 14,
                                            padding: "15px 16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: "#ffe08a",
                                            }}
                                        >
                                            Titan is waiting for your reply
                                        </div>

                                        <div
                                            style={{
                                                color: "var(--titan-text)",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            Send your update below and we’ll continue working on this case.
                                        </div>
                                    </div>
                                ) : null}

                                <div
                                    style={{
                                        padding: "15px 16px",
                                        borderRadius: "14px",
                                        border: "1px solid rgba(114, 183, 255, 0.16)",
                                        background: "rgba(12, 28, 54, 0.62)",
                                    }}
                                >
                                    <form
                                        onSubmit={handleReplySubmit}
                                        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "12px",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <div style={{ fontWeight: 700 }}>Reply to Titan</div>
                                            <div style={{ color: "var(--titan-text-soft)", fontSize: "0.92rem" }}>
                                                {selectedCaseIsReplyLocked
                                                    ? "Replies are locked for resolved cases."
                                                    : "Your reply draft stays in place while auto-refresh runs."}
                                            </div>
                                        </div>

                                        <textarea
                                            style={{
                                                ...fieldInputStyle,
                                                minHeight: "132px",
                                                padding: "14px",
                                                resize: "vertical",
                                                lineHeight: 1.6,
                                            }}
                                            value={replyDraft}
                                            onChange={(event) => setReplyDraft(event.target.value)}
                                            placeholder="Type your update for Titan here."
                                            disabled={selectedCaseIsReplyLocked || isReplySubmitting}
                                        />

                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <button
                                                className="primary-button"
                                                type="submit"
                                                disabled={
                                                    selectedCaseIsReplyLocked ||
                                                    isReplySubmitting ||
                                                    replyDraft.trim().length === 0
                                                }
                                            >
                                                {isReplySubmitting ? "Sending..." : "Send Reply"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div>
                                    <div style={{ display: "grid", gap: 6, marginBottom: "10px" }}>
                                        <div style={{ fontWeight: 700 }}>Case Timeline</div>
                                        <div style={{ color: "var(--titan-text-soft)", fontSize: "0.92rem" }}>
                                            Newest updates appear first. Open any update to read the full note.
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                                        {selectedCase.comments.length === 0 ? (
                                            <div className="center-message">No updates have been posted on this case yet.</div>
                                        ) : (
                                            selectedCase.comments.map((entry) => (
                                                <TimelineEntryCard key={entry.id} entry={entry} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="center-message">Choose a case to review the full details and reply history.</div>
                        )}
                    </SectionCard>
                </>
            )}
        </div>
    );
}

const timelineButtonStyle: React.CSSProperties = {
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