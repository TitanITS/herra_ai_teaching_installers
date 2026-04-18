import { useEffect, useMemo, useState } from "react";
import TitanCard from "../components/TitanCard";
import TitanButton from "../components/TitanButton";
import StatusPill from "../components/StatusPill";
import { systemApi } from "../features/system/systemApi";
import type {
    AuditData,
    TrustData,
    ConfidenceData,
    AiModelsData,
    AiRuntimeProfileData,
    MetaData,
} from "../features/system/systemTypes";
import type { ApiErrorResponse, ApiSuccessResponse } from "../lib/http/types";

type AnyOk<T> = ApiSuccessResponse<T>;
type AnyErr = ApiErrorResponse;

function isOk<T>(x: AnyOk<T> | AnyErr): x is AnyOk<T> {
    return x.success === true;
}

function fmtWhen(s?: string | null) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
}

function pctFromRatio(n?: number | null) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `${Math.round(n * 100)}%`;
}

function fixed3(n?: number | null) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return n.toFixed(3);
}

function trustTone(level?: string | null) {
    switch ((level ?? "").toLowerCase()) {
        case "high":
            return "ok";
        case "medium":
            return "warn";
        case "low":
            return "danger";
        default:
            return "muted";
    }
}

function confidenceTone(level?: string | null) {
    switch ((level ?? "").toLowerCase()) {
        case "high":
            return "ok";
        case "medium":
            return "warn";
        case "low":
            return "danger";
        default:
            return "muted";
    }
}

function healthSummaryTone(meta?: MetaData | null) {
    if (!meta) return "muted";
    if (meta.features?.health) return "ok";
    return "danger";
}

function healthSummaryLabel(meta?: MetaData | null) {
    if (!meta) return "Unknown";
    return meta.features?.health ? "Good" : "Down";
}

function runtimeSummaryTone(meta?: MetaData | null) {
    if (!meta) return "muted";
    if (meta.features?.ai_runtime_profile) return "ok";
    return "danger";
}

function runtimeSummaryLabel(meta?: MetaData | null) {
    if (!meta) return "Unknown";
    return meta.features?.ai_runtime_profile ? "Healthy" : "Down";
}

export default function SystemAuditPage() {
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string>("");

    const [meta, setMeta] = useState<MetaData | null>(null);
    const [audit, setAudit] = useState<AuditData | null>(null);
    const [trust, setTrust] = useState<TrustData | null>(null);
    const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
    const [aiModels, setAiModels] = useState<AiModelsData | null>(null);
    const [runtimeProfile, setRuntimeProfile] = useState<AiRuntimeProfileData | null>(null);

    const [requestId, setRequestId] = useState<string>("");

    const statusTone = useMemo(() => {
        if (errMsg) return "danger";
        if (loading) return "info";
        return "ok";
    }, [errMsg, loading]);

    async function loadAll() {
        setLoading(true);
        setErrMsg("");
        setRequestId("");

        const [metaRes, auditRes, trustRes, confRes, modelsRes, runtimeRes] = await Promise.all([
            systemApi.meta(),
            systemApi.audit(),
            systemApi.trust(),
            systemApi.confidence(),
            systemApi.aiModels(),
            systemApi.aiRuntimeProfile(),
        ]);

        const firstErr =
            (!isOk(metaRes) && metaRes) ||
            (!isOk(auditRes) && auditRes) ||
            (!isOk(trustRes) && trustRes) ||
            (!isOk(confRes) && confRes) ||
            (!isOk(modelsRes) && modelsRes) ||
            (!isOk(runtimeRes) && runtimeRes);

        if (firstErr && !isOk(firstErr)) {
            setErrMsg(`${firstErr.error.code}: ${firstErr.error.message}`);
            setLoading(false);
            return;
        }

        setMeta(isOk(metaRes) ? metaRes.data : null);
        setAudit(isOk(auditRes) ? auditRes.data : null);
        setTrust(isOk(trustRes) ? trustRes.data : null);
        setConfidence(isOk(confRes) ? confRes.data : null);
        setAiModels(isOk(modelsRes) ? modelsRes.data : null);
        setRuntimeProfile(isOk(runtimeRes) ? runtimeRes.data : null);

        const rid =
            (isOk(metaRes) ? metaRes.meta?.request_id : undefined) ??
            (isOk(auditRes) ? auditRes.meta?.request_id : undefined) ??
            (isOk(trustRes) ? trustRes.meta?.request_id : undefined) ??
            (isOk(confRes) ? confRes.meta?.request_id : undefined) ??
            (isOk(modelsRes) ? modelsRes.meta?.request_id : undefined) ??
            (isOk(runtimeRes) ? runtimeRes.meta?.request_id : undefined) ??
            "";

        setRequestId(rid);
        setLoading(false);
    }

    useEffect(() => {
        void loadAll();
    }, []);

    function exportSnapshot() {
        const snapshot = {
            exported_at: new Date().toISOString(),
            request_id: requestId || null,
            meta,
            runtime_profile: runtimeProfile,
            ai_models: aiModels,
            trust,
            confidence,
            audit,
        };

        const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `herra_system_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const providerCount = aiModels?.providers?.length ?? 0;
    const modelCount =
        aiModels?.providers?.reduce((sum, p) => sum + (p.models?.length ?? 0), 0) ?? 0;

    const runtime = runtimeProfile?.profile ?? null;
    const auditEntries = audit?.entries ?? [];

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 xl:w-[58%]">
                    <div className="text-3xl font-extrabold text-white">System</div>
                    <div className="mt-1 text-sm text-slate-300">
                        Review system health, AI runtime, trust metrics, and recent activity.
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <StatusPill
                        tone={statusTone as any}
                        label={errMsg ? "Error" : loading ? "Loading…" : "Ready"}
                        title={errMsg || undefined}
                    />
                    {requestId ? <StatusPill tone="muted" label={`request_id: ${requestId}`} /> : null}
                    <TitanButton variant="secondary" onClick={() => void loadAll()} disabled={loading}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </TitanButton>
                    <TitanButton variant="primary" onClick={exportSnapshot} disabled={loading}>
                        Export System Snapshot
                    </TitanButton>
                </div>
            </div>

            {errMsg ? (
                <TitanCard title="System Error" subtitle="One or more system data requests failed.">
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200 break-words">
                        {errMsg}
                    </div>
                </TitanCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <TitanCard title="System Summary" subtitle="Top-level platform status at a glance." bodyClassName="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">App</div>
                            <div className="mt-1 text-sm font-semibold text-white">{meta?.app_name ?? "—"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Version</div>
                            <div className="mt-1 text-sm font-semibold text-white">{meta?.app_version ?? "—"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Environment</div>
                            <div className="mt-1 text-sm font-semibold text-white">{meta?.env ?? "—"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Registry Entries</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                                {typeof trust?.total === "number" ? trust.total : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatusPill
                            tone={meta?.features?.docs ? "ok" : "danger"}
                            label={`API Docs: ${meta?.features?.docs ? "Enabled" : "Disabled"}`}
                        />
                        <StatusPill
                            tone={healthSummaryTone(meta)}
                            label={`Health: ${healthSummaryLabel(meta)}`}
                        />
                        <StatusPill
                            tone={meta?.features?.connector_jobs ? "ok" : "danger"}
                            label={`Connector Jobs: ${meta?.features?.connector_jobs ? "Enabled" : "Disabled"}`}
                        />
                        <StatusPill
                            tone={runtimeSummaryTone(meta)}
                            label={`AI Runtime: ${runtimeSummaryLabel(meta)}`}
                        />
                    </div>
                </TitanCard>

                <div className="xl:col-span-3">
                    <TitanCard title="Available AI Resources" subtitle="Platform-supported providers and models available for runtime selection.">
                        <div className="max-h-[440px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                            {providerCount === 0 ? (
                                <div className="text-sm text-slate-300">No AI resources available.</div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 pb-1">
                                        <StatusPill tone="info" label={`${providerCount} Providers`} />
                                        <StatusPill tone="info" label={`${modelCount} Models`} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        {aiModels?.providers?.map((provider) => (
                                            <div key={provider.provider_key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                                <div className="text-sm font-semibold text-white">{provider.provider_label}</div>
                                                <div className="mt-1 text-xs text-slate-400">{provider.provider_key}</div>

                                                <div className="mt-3 space-y-2">
                                                    {provider.models.map((model) => (
                                                        <div key={model.model_key} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                                            <div className="text-sm text-white">{model.model_label}</div>
                                                            <div className="mt-1 text-xs text-slate-500">{model.model_key}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TitanCard>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard title="Current AI Runtime" subtitle="The currently selected runtime mode and model configuration used by the platform.">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Mode</div>
                            <div className="mt-1 text-sm font-semibold text-white">{runtime?.mode ?? "—"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Profile</div>
                            <div className="mt-1 text-sm font-semibold text-white">{runtime?.profile_key ?? "—"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Provider</div>
                            <div className="mt-1 text-sm font-semibold text-white">{runtime?.provider_key ?? "Autodetect / Not selected"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Model</div>
                            <div className="mt-1 text-sm font-semibold text-white">{runtime?.model_key ?? "Autodetect / Not selected"}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:col-span-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Notes</div>
                            <div className="mt-1 text-sm text-white break-words">{runtime?.notes || "No runtime notes provided."}</div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:col-span-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">Last Updated</div>
                            <div className="mt-1 text-sm font-semibold text-white">{fmtWhen(runtime?.updated_at)}</div>
                        </div>
                    </div>
                </TitanCard>

                <TitanCard title="Trust Score" subtitle="Content quality score derived from the current registry and penalized entry ratio.">
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <StatusPill tone={trustTone(trust?.trust_level)} label={`Level: ${trust?.trust_level ?? "—"}`} />
                            <StatusPill tone="info" label={`Average Score: ${fixed3(trust?.average_trust_score)}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Total Entries</div>
                                <div className="mt-1 text-lg font-bold text-white">{typeof trust?.total === "number" ? trust.total : "—"}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Trusted Entries</div>
                                <div className="mt-1 text-lg font-bold text-white">{typeof trust?.trusted === "number" ? trust.trusted : "—"}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Penalized Entries</div>
                                <div className="mt-1 text-lg font-bold text-white">{typeof trust?.penalized === "number" ? trust.penalized : "—"}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Trusted Ratio</div>
                                <div className="mt-1 text-lg font-bold text-white">{pctFromRatio(trust?.average_trust_score)}</div>
                            </div>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold text-white">How to improve this score</div>
                            <div className="mt-2 space-y-2 text-sm text-slate-300">
                                <div>• Review and penalize entries that are inaccurate, duplicated, or outdated.</div>
                                <div>• Prioritize ingestion from approved internal files and validated sources.</div>
                                <div>• Remove test content and low-value placeholder data from the registry.</div>
                                <div>• Re-ingest corrected source files after cleanup to improve trust quality.</div>
                            </div>

                            {(trust?.reason || trust?.status) ? (
                                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                                    <div className="font-semibold text-white">Current trust note</div>
                                    <div className="mt-1 break-words">
                                        {trust?.reason || trust?.status}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </TitanCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard title="Confidence" subtitle="Registry confidence based on current token distribution and analyzed entry set.">
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <StatusPill tone={confidenceTone(confidence?.confidence)} label={`Level: ${confidence?.confidence ?? "—"}`} />
                            <StatusPill tone="info" label={`Score: ${fixed3(confidence?.confidence_score)}`} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Average Tokens</div>
                                <div className="mt-1 text-lg font-bold text-white">{typeof confidence?.average_tokens === "number" ? confidence.average_tokens : "—"}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Analyzed Entries</div>
                                <div className="mt-1 text-lg font-bold text-white">{typeof confidence?.analyzed_entries === "number" ? confidence.analyzed_entries : "—"}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">Confidence %</div>
                                <div className="mt-1 text-lg font-bold text-white">{pctFromRatio(confidence?.confidence_score)}</div>
                            </div>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                            <div className="text-sm font-semibold text-white">How to improve this score</div>
                            <div className="mt-2 space-y-2 text-sm text-slate-300">
                                <div>• Ingest larger, more complete source documents instead of isolated snippets.</div>
                                <div>• Favor structured content with meaningful context over short fragments.</div>
                                <div>• Reduce duplicate or low-information entries in the registry.</div>
                                <div>• Re-ingest corrected source material after cleanup and validation.</div>
                            </div>

                            {(confidence?.reason || confidence?.status) ? (
                                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                                    <div className="font-semibold text-white">Current confidence note</div>
                                    <div className="mt-1 break-words">
                                        {confidence?.reason || confidence?.status}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </TitanCard>

                <TitanCard title="Audit Activity" subtitle="Recent system activity and operational events. This panel scrolls independently.">
                    <div className="max-h-[440px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {auditEntries.length === 0 ? (
                            <div className="text-sm text-slate-300">No audit activity available.</div>
                        ) : (
                            <div className="space-y-3">
                                {auditEntries.map((entry) => (
                                    <div key={`${entry.id}-${entry.created_at}`} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white">ID {entry.id}</span>
                                                <StatusPill tone="info" label={entry.action} />
                                            </div>
                                            <div className="text-xs text-slate-400">{fmtWhen(entry.created_at)}</div>
                                        </div>

                                        {entry.reference_id != null && entry.reference_id !== entry.id ? (
                                            <div className="mt-2 text-xs text-slate-400">
                                                Linked ID: {entry.reference_id}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TitanCard>
            </div>
        </div>
    );
}