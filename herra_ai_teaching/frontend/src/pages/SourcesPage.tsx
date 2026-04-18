import { useEffect, useMemo, useState } from "react";
import TitanButton from "../components/TitanButton";
import TitanCard from "../components/TitanCard";
import { connectorsApi } from "../features/connectors/connectorsApi";
import type { Connector } from "../features/connectors/connectorsTypes";
import { jobsApi } from "../features/jobs/jobsApi";
import type { Job } from "../features/jobs/jobsTypes";
import { systemApi } from "../features/system/systemApi";
import type { AiSourceItem } from "../features/system/systemTypes";

type SourcesLoadState =
    | { status: "loading" }
    | {
        status: "error";
        message: string;
        requestId?: string;
        partial?: SourcesSuccessState;
    }
    | SourcesSuccessState;

type SourcesSuccessState = {
    status: "success";
    requestId: string;
    sources: AiSourceItem[];
    activeSource: string;
    connectors: Connector[];
    jobs: Job[];
};

type IngestionSourceCard = {
    key: string;
    title: string;
    status: "Active" | "Conditional" | "Planned";
    connectorRequired: "Yes" | "No" | "Optional";
    operationalState: string;
    description: string;
    notes: string[];
};

type ContentGroup = {
    title: string;
    description: string;
    items: string[];
};

const deploymentMode = (import.meta.env.VITE_DEPLOYMENT_MODE ?? "saas").toLowerCase();
const isPrivateDeployment = deploymentMode === "private";

const ingestionSourceCards: IngestionSourceCard[] = [
    {
        key: "local_upload",
        title: "Local File Upload",
        status: "Active",
        connectorRequired: "No",
        operationalState: "Available through direct UI upload workflows.",
        description: "Manual upload path for bringing content directly into the platform without connector dependency.",
        notes: [
            "Best for one-off imports and operator-driven ingestion.",
            "Useful when source systems are not yet connected.",
            "Fits controlled testing and validation workflows.",
        ],
    },
    {
        key: "connector_scan",
        title: "Connector-Based Folder Scan",
        status: "Conditional",
        connectorRequired: "Yes",
        operationalState: "Available whenever at least one connector is online.",
        description: "Uses the Windows connector to reach on-prem or managed file locations for discovery and ingest preparation.",
        notes: [
            "Supports operational scanning from reachable environments.",
            "Depends on connector health and target path accessibility.",
            "Best fit for repeatable enterprise discovery.",
        ],
    },
    {
        key: "auto_detect",
        title: "Auto Detect Discovered Paths",
        status: "Active",
        connectorRequired: "Optional",
        operationalState: "Available through the existing Auto Detect workflow.",
        description: "Surfaces discovered locations and candidate paths that can be reviewed before scan or ingest actions.",
        notes: [
            "Complements connector-based visibility.",
            "Supports staged discovery before ingestion.",
            "Keeps the admin in control of what enters the pipeline.",
        ],
    },
    {
        key: "managed_profiles",
        title: "Managed Source Profiles",
        status: "Planned",
        connectorRequired: "Optional",
        operationalState: "Future saved source definitions for repeatable admin-managed ingestion targets.",
        description: "Planned control plane for reusable ingestion definitions such as named folders, network shares, connector-backed paths, or recurring source targets.",
        notes: [
            "Intended future home for saved reusable source definitions.",
            "Could later support scheduling, ownership, and policy controls.",
            "Not yet backed by a dedicated source registry endpoint.",
        ],
    },
];

const contentGroups: ContentGroup[] = [
    {
        title: "Documents",
        description: "Common document-oriented teaching and business content.",
        items: ["PDF", "DOC", "DOCX", "TXT", "RTF", "MD"],
    },
    {
        title: "Spreadsheets",
        description: "Structured tabular content for analysis and export workflows.",
        items: ["XLS", "XLSX", "CSV", "TSV"],
    },
    {
        title: "Presentations",
        description: "Slide-based materials used for instruction and briefings.",
        items: ["PPT", "PPTX"],
    },
    {
        title: "Structured / Data",
        description: "Machine-readable formats often used in technical or system exports.",
        items: ["JSON", "XML", "YAML", "LOG"],
    },
    {
        title: "Images",
        description: "Visual assets that may be stored, referenced, or processed depending on workflow compatibility.",
        items: ["PNG", "JPG", "JPEG", "GIF", "BMP", "WEBP", "TIFF"],
    },
    {
        title: "Media / Extended Types",
        description: "Reserved for broader intake expansion where processing rules may differ by content compatibility.",
        items: ["Audio", "Video", "Archive Types", "Other detected enterprise file types"],
    },
];

function formatDateTime(value?: string | null) {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString();
}

function formatRelativeTime(value?: string | null) {
    if (!value) return "Unknown";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    const deltaMs = Date.now() - parsed.getTime();
    const deltaSeconds = Math.round(deltaMs / 1000);
    const abs = Math.abs(deltaSeconds);

    if (abs < 60) return `${abs}s ago`;
    if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
    if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
    return `${Math.round(abs / 86400)}d ago`;
}

function statusTone(status: string) {
    const normalized = status.toLowerCase();

    if (normalized === "active" || normalized === "succeeded" || normalized === "online") {
        return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
    }

    if (normalized === "conditional" || normalized === "queued" || normalized === "running") {
        return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
    }

    if (normalized === "planned") {
        return "border-amber-400/25 bg-amber-500/10 text-amber-100";
    }

    if (normalized === "failed" || normalized === "offline") {
        return "border-rose-400/25 bg-rose-500/10 text-rose-100";
    }

    return "border-white/10 bg-white/5 text-slate-200";
}

function summaryValueClass(isGood: boolean) {
    return isGood ? "text-white" : "text-slate-300";
}

function sourceSortWeight(source: AiSourceItem) {
    if (source.key === "mock") return 999;
    return 0;
}

export default function SourcesPage() {
    const [state, setState] = useState<SourcesLoadState>({ status: "loading" });
    const [selectedKey, setSelectedKey] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function load() {
        setState({ status: "loading" });
        setMsg(null);

        try {
            const [sourcesRes, activeRes, connectorsRes, jobsRes] = await Promise.all([
                systemApi.aiSources(),
                systemApi.aiSource(),
                isPrivateDeployment
                    ? Promise.resolve({
                        success: true as const,
                        data: { connectors: [] },
                        meta: { request_id: "private" },
                    })
                    : connectorsApi.status(),
                isPrivateDeployment
                    ? Promise.resolve({
                        success: true as const,
                        data: { jobs: [] },
                        meta: { request_id: "private" },
                    })
                    : jobsApi.list(50),
            ]);

            const partial: Partial<SourcesSuccessState> = {
                status: "success",
                requestId:
                    activeRes.meta?.request_id ??
                    sourcesRes.meta?.request_id ??
                    connectorsRes.meta?.request_id ??
                    jobsRes.meta?.request_id ??
                    "unknown",
                sources: sourcesRes.success ? sourcesRes.data.sources ?? [] : [],
                activeSource: activeRes.success ? activeRes.data.active_source ?? "mock" : "mock",
                connectors: connectorsRes.success ? connectorsRes.data.connectors ?? [] : [],
                jobs: jobsRes.success ? jobsRes.data.jobs ?? [] : [],
            };

            if (!sourcesRes.success) {
                setState({
                    status: "error",
                    message: `${sourcesRes.error.code}: ${sourcesRes.error.message}`,
                    requestId: sourcesRes.meta?.request_id,
                    partial: partial as SourcesSuccessState,
                });
                return;
            }

            if (!activeRes.success) {
                setState({
                    status: "error",
                    message: `${activeRes.error.code}: ${activeRes.error.message}`,
                    requestId: activeRes.meta?.request_id,
                    partial: partial as SourcesSuccessState,
                });
                return;
            }

            const nextState: SourcesSuccessState = {
                status: "success",
                requestId: activeRes.meta.request_id,
                sources: partial.sources ?? [],
                activeSource: partial.activeSource ?? "mock",
                connectors: partial.connectors ?? [],
                jobs: partial.jobs ?? [],
            };

            setState(nextState);
            setSelectedKey(nextState.activeSource);
        } catch {
            setState({
                status: "error",
                message: "CLIENT_ERROR: Network error while loading Sources data.",
            });
        }
    }

    async function setActive() {
        if (state.status !== "success") return;

        const key = selectedKey.trim();
        if (!key) {
            setMsg("Please choose an AI processing source first.");
            return;
        }

        setSaving(true);
        setMsg(null);

        try {
            const res = await systemApi.setAiRuntimeProfile({
                mode: "manual",
                provider_key: key,
                model_key: null,
                notes: "Updated from Sources tab",
            });

            if (res.success) {
                setMsg(`AI runtime profile updated to provider "${key}". request_id: ${res.meta.request_id}`);
                setSaving(false);
                await load();
                return;
            }

            const fallback = await fetchAiSourceFallback(key);
            if (fallback.success) {
                setMsg(`Active AI source set to "${fallback.activeSource}". request_id: ${fallback.requestId}`);
                setSaving(false);
                await load();
                return;
            }

            setMsg(fallback.message);
            setSaving(false);
        } catch {
            setSaving(false);
            setMsg("CLIENT_ERROR: Network error while saving the active AI source.");
        }
    }

    async function fetchAiSourceFallback(key: string): Promise<
        | { success: true; activeSource: string; requestId: string }
        | { success: false; message: string }
    > {
        try {
            const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000"}/system/ai-source`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source_key: key }),
            });

            const json = (await response.json()) as
                | {
                    success: true;
                    data: { active_source: string };
                    meta: { request_id: string };
                }
                | {
                    success: false;
                    error: { code: string; message: string };
                    meta?: { request_id?: string };
                };

            if (json.success) {
                return {
                    success: true,
                    activeSource: json.data.active_source,
                    requestId: json.meta.request_id,
                };
            }

            return {
                success: false,
                message: `${json.error.code}: ${json.error.message} (request_id: ${json.meta?.request_id ?? "?"})`,
            };
        } catch {
            return {
                success: false,
                message: "CLIENT_ERROR: Network error while saving the active AI source.",
            };
        }
    }

    useEffect(() => {
        void load();
    }, []);

    const data = state.status === "success" ? state : state.status === "error" ? state.partial ?? null : null;

    const connectorCount = data?.connectors.length ?? 0;
    const connectorOnline = connectorCount > 0;

    const sortedConnectors = useMemo(() => {
        return [...(data?.connectors ?? [])].sort((a, b) => {
            const aTime = new Date(a.last_seen || a.created_at).getTime();
            const bTime = new Date(b.last_seen || b.created_at).getTime();
            return bTime - aTime;
        });
    }, [data?.connectors]);

    const sortedSources = useMemo(() => {
        return [...(data?.sources ?? [])].sort((a, b) => {
            const weightDiff = sourceSortWeight(a) - sourceSortWeight(b);
            if (weightDiff !== 0) return weightDiff;
            return a.label.localeCompare(b.label);
        });
    }, [data?.sources]);

    const relevantJobs = useMemo(() => {
        return (data?.jobs ?? []).filter(
            (job) => job.job_type === "folder_scan" || job.job_type === "files_ingest" || job.job_type === "ad_discovery",
        );
    }, [data?.jobs]);

    const runningJobs = useMemo(() => {
        return relevantJobs.filter((job) => job.status === "queued" || job.status === "running").length;
    }, [relevantJobs]);

    const visibleIngestionSourceCards = useMemo(() => {
        if (!isPrivateDeployment) return ingestionSourceCards;
        return ingestionSourceCards.filter((card) => card.connectorRequired !== "Yes");
    }, []);

    const contentCoverage = "Broad detected file support";
    const ingestionReadiness = isPrivateDeployment ? "Ready" : connectorOnline ? "Ready" : "Limited";

    return (
        <div className="space-y-5">
            <TitanCard
                className="overflow-visible"
                title="Sources"
                subtitle={
                    isPrivateDeployment
                        ? "Manage content intake, supported content types, and active AI processing sources for private deployment."
                        : "Manage content intake, connector-accessible locations, supported content types, and active AI processing sources."
                }
                right={
                    <div className="flex flex-wrap gap-2">
                        <TitanButton variant="secondary" onClick={load} disabled={saving}>
                            Refresh
                        </TitanButton>
                        <TitanButton variant="primary" onClick={setActive} disabled={saving || !data || state.status === "loading"}>
                            {saving ? "Saving…" : "Set Active AI Source"}
                        </TitanButton>
                    </div>
                }
            >
                <div className={`grid gap-3 ${isPrivateDeployment ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Active AI Source</div>
                        <div className={["mt-2 text-lg font-semibold", summaryValueClass(!!data?.activeSource)].join(" ")}>
                            {data?.activeSource ?? "Loading…"}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Supported providers can be selected below for runtime processing.
                        </div>
                    </div>

                    {!isPrivateDeployment ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Connector Status</div>
                            <div className={["mt-2 text-lg font-semibold", summaryValueClass(connectorOnline)].join(" ")}>
                                {connectorOnline ? `${connectorCount} Online` : "Offline"}
                            </div>
                            <div className="mt-2 text-xs text-slate-400">
                                Connector-backed scans and environment discovery depend on at least one live connector.
                            </div>
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {isPrivateDeployment ? "Deployment Mode" : "Ingestion Readiness"}
                        </div>
                        <div className={["mt-2 text-lg font-semibold", summaryValueClass(ingestionReadiness === "Ready")].join(" ")}>
                            {isPrivateDeployment ? "Private Server" : ingestionReadiness}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            {isPrivateDeployment
                                ? "This deployment uses direct local/server intake workflows and does not rely on SaaS connectors."
                                : connectorOnline
                                    ? "Manual intake and connector-driven discovery are both available."
                                    : "Manual intake remains available. Connector-dependent source workflows are limited."}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Content Coverage</div>
                        <div className="mt-2 text-lg font-semibold text-white">{contentCoverage}</div>
                        <div className="mt-2 text-xs text-slate-400">
                            Unsupported or incompatible files should be skipped or flagged during processing.
                        </div>
                    </div>
                </div>

                {state.status === "loading" ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                        Loading Sources control plane…
                    </div>
                ) : null}

                {state.status === "error" ? (
                    <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        <div className="font-semibold">Sources load warning</div>
                        <div className="mt-1 break-words">{state.message}</div>
                        {state.requestId ? (
                            <div className="mt-2 text-xs text-slate-300">request_id: {state.requestId}</div>
                        ) : null}
                        {state.partial ? (
                            <div className="mt-2 text-xs text-slate-300">
                                Partial data is shown below where available.
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {msg ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 break-words">
                        {msg}
                    </div>
                ) : null}

                {data ? (
                    <div className="mt-4 text-xs text-slate-400">request_id: {data.requestId}</div>
                ) : null}
            </TitanCard>

            <div className="grid gap-5 xl:grid-cols-12">
                <TitanCard
                    className="xl:col-span-6"
                    title="AI Processing Sources"
                    subtitle="Choose which provider powers runtime processing. This panel keeps a fixed height and scrolls internally when needed."
                    bodyClassName="p-0"
                >
                    <div className="h-[560px] overflow-y-auto px-5 py-4">
                        {!data ? (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                                AI source data is not available yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Active Source</div>
                                    <div className="mt-2 text-lg font-semibold text-white">{data.activeSource}</div>
                                    <div className="mt-2 text-sm text-slate-300">
                                        Use this section to select the provider that should handle AI processing tasks.
                                    </div>
                                </div>

                                {sortedSources.map((source) => {
                                    const isActive = source.key === data.activeSource;
                                    const isSelected = source.key === selectedKey;
                                    const isMock = source.key === "mock";

                                    return (
                                        <button
                                            key={source.key}
                                            type="button"
                                            onClick={() => setSelectedKey(source.key)}
                                            className={[
                                                "w-full rounded-2xl border p-4 text-left transition",
                                                "bg-black/20 hover:bg-black/30",
                                                isSelected ? "border-cyan-300/60 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]" : "border-white/10",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-base font-semibold text-white">
                                                        {source.label} <span className="font-normal text-slate-400">({source.key})</span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {isActive ? (
                                                            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                                                                Active
                                                            </span>
                                                        ) : null}

                                                        {isSelected ? (
                                                            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                                                                Selected
                                                            </span>
                                                        ) : null}

                                                        {isMock ? (
                                                            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                                                                Internal / Test
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    {isMock ? (
                                                        <div className="mt-3 text-sm text-slate-300">
                                                            Useful for local testing and fallback validation. Consider hiding this in customer-facing production later.
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="text-right text-xs text-slate-400">
                                                    <div>Runtime provider</div>
                                                    <div className="mt-1">{isActive ? "In use" : "Available"}</div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                                    This section preserves your AI source control while keeping test-oriented providers visually separated from standard runtime providers.
                                </div>
                            </div>
                        )}
                    </div>
                </TitanCard>

                <TitanCard
                    className="xl:col-span-6"
                    title="Ingestion Source Types"
                    subtitle={
                        isPrivateDeployment
                            ? "Operational intake methods available now for private deployment and the next reusable saved-source layer planned for later."
                            : "Operational intake methods available now and the next reusable saved-source layer planned for later."
                    }
                    bodyClassName="p-0"
                >
                    <div className="h-[560px] overflow-y-auto px-5 py-4">
                        <div className="grid gap-3">
                            {visibleIngestionSourceCards.map((card) => (
                                <div key={card.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="text-base font-semibold text-white">{card.title}</div>
                                            <div className="mt-2 text-sm text-slate-300">{card.description}</div>
                                        </div>

                                        <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusTone(card.status)].join(" ")}>
                                            {card.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                                {isPrivateDeployment ? "Local / Direct Intake" : "Connector Required"}
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-white">
                                                {isPrivateDeployment
                                                    ? card.connectorRequired === "Yes"
                                                        ? "No"
                                                        : card.connectorRequired
                                                    : card.connectorRequired}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Operational State</div>
                                            <div className="mt-1 text-sm font-semibold text-white">{card.operationalState}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Notes</div>
                                        <div className="mt-2 space-y-2">
                                            {card.notes.map((note) => (
                                                <div key={note} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                                                    {note}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TitanCard>

                {!isPrivateDeployment ? (
                    <TitanCard
                        className="xl:col-span-6"
                        title="Connector-Accessible Sources"
                        subtitle="Live connector visibility, host metadata, and current source activity. This panel stays fixed-height with an internal scrollbar."
                        bodyClassName="p-0"
                    >
                        <div className="h-[560px] overflow-y-auto px-5 py-4">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="text-base font-semibold text-white">Connector Availability</div>
                                            <div className="mt-2 text-sm text-slate-300">
                                                {connectorOnline
                                                    ? "At least one connector is currently online and can support discovery or scan workflows."
                                                    : "No connector is currently online. Manual intake remains available, but connector-based access is limited."}
                                            </div>
                                        </div>

                                        <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusTone(connectorOnline ? "online" : "offline")].join(" ")}>
                                            {connectorOnline ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Connected Hosts</div>
                                        <div className="mt-2 text-2xl font-semibold text-white">{connectorCount}</div>
                                        <div className="mt-2 text-xs text-slate-400">Unique connector records currently reported by the backend.</div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Active Source Jobs</div>
                                        <div className="mt-2 text-2xl font-semibold text-white">{runningJobs}</div>
                                        <div className="mt-2 text-xs text-slate-400">Queued or running discovery, scan, or ingest jobs across the platform.</div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Connector Records</div>

                                    {sortedConnectors.length > 0 ? (
                                        <div className="mt-3 space-y-3">
                                            {sortedConnectors.map((connector) => (
                                                <div key={connector.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-base font-semibold text-white">{connector.name}</div>
                                                            <div className="mt-1 text-sm text-slate-300">Connector ID: {connector.id}</div>
                                                        </div>
                                                        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                                                            Online
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Platform</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">{connector.os || "Unknown"}</div>
                                                        </div>

                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Last Seen</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {formatDateTime(connector.last_seen)}
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-400">
                                                                {formatRelativeTime(connector.last_seen)}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Created</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {formatDateTime(connector.created_at)}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Operational Notes</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                Scan-ready when paths are reachable
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {connector.meta && Object.keys(connector.meta).length > 0 ? (
                                                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Connector Metadata</div>
                                                            <pre className="mt-2 overflow-x-auto text-xs text-slate-300 whitespace-pre-wrap break-words">
                                                                {JSON.stringify(connector.meta, null, 2)}
                                                            </pre>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                                            No live connector records are available right now.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TitanCard>
                ) : (
                    <TitanCard
                        className="xl:col-span-6"
                        title="Private Deployment"
                        subtitle="This deployment runs directly on the customer-controlled server and does not require SaaS connector services."
                        bodyClassName="p-0"
                    >
                        <div className="h-[560px] overflow-y-auto px-5 py-4">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="text-base font-semibold text-white">Direct Server Operation</div>
                                            <div className="mt-2 text-sm text-slate-300">
                                                This private deployment uses local/server-hosted workflows. Connector-backed SaaS discovery and remote bridge services are intentionally not part of this installation.
                                            </div>
                                        </div>

                                        <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                                            Private
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Local Intake Mode</div>
                                        <div className="mt-2 text-2xl font-semibold text-white">Enabled</div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Manual intake, local file handling, and server-side processing remain available.
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Connector Services</div>
                                        <div className="mt-2 text-2xl font-semibold text-white">Not Used</div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            This product configuration does not rely on SaaS connector availability or connector job polling.
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Operational Guidance</div>
                                    <div className="mt-3 space-y-2">
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                                            Use direct upload, ingest, and local processing workflows for this deployment.
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                                            AI source selection remains available and can still be controlled from this page.
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                                            Future private-deployment discovery features can be added later without exposing SaaS connector status in this interface.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TitanCard>
                )}

                <TitanCard
                    className="xl:col-span-6"
                    title="Supported Content Types"
                    subtitle="Grouped content coverage for the current platform stage. Unsupported or incompatible files should be skipped or flagged during processing."
                    bodyClassName="p-0"
                >
                    <div className="h-[560px] overflow-y-auto px-5 py-4">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="text-base font-semibold text-white">Content Compatibility Guidance</div>
                                <div className="mt-2 text-sm text-slate-300">
                                    This page intentionally uses broad, honest wording instead of claiming universal file support.
                                    The system should handle common detected enterprise content types, while unsupported or incompatible items are skipped or flagged.
                                </div>
                            </div>

                            {contentGroups.map((group) => (
                                <div key={group.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-base font-semibold text-white">{group.title}</div>
                                    <div className="mt-2 text-sm text-slate-300">{group.description}</div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {group.items.map((item) => (
                                            <span
                                                key={`${group.title}-${item}`}
                                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TitanCard>
            </div>
        </div>
    );
}