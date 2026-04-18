import { useEffect, useMemo, useState } from "react";
import TitanButton from "./TitanButton";
import TitanCard from "./TitanCard";
import StatusPill from "./StatusPill";

import { jobsApi } from "../features/jobs/jobsApi";
import { connectorsApi } from "../features/connectors/connectorsApi";
import type { Connector } from "../features/connectors/connectorsTypes";
import type { Job } from "../features/jobs/jobsTypes";
import type { FileIngestPanelIngestedEvent } from "./FileIngestPanel";

/**
 * Auto Detect event: extends the manual ingest event with scan context.
 * This keeps Auto history separate and prevents mixing types with manual history.
 */
export type FolderScanIngestedEvent = FileIngestPanelIngestedEvent & {
    scan: {
        rootPath: string;
        includeGlobs: string[];
        excludeGlobs: string[];
        maxFiles: number;
        maxDepth: number;
        scannedCount: number;
        scanRequestId?: string;
    };
};

type Props = {
    onIngested?: (evt: FolderScanIngestedEvent) => void | Promise<void>;
};

type ScannedFile = {
    path: string;
    relative_path: string;
    size_bytes: number;
    name?: string;
};

type ConnectorScanResult = {
    root_path: string;
    include_globs: string[];
    exclude_globs: string[];
    max_files: number;
    max_depth: number;
    files_found: number;
    files: ScannedFile[];
    error?: string;
};

type ScanState =
    | { status: "idle" }
    | { status: "scanning" }
    | { status: "scanned"; result: ConnectorScanResult; requestId?: string }
    | { status: "error"; message: string; requestId?: string };

type OpsState = {
    connectorChecked: boolean;
    connectorOnline: boolean;
    connectors: Connector[];
    jobs: Job[];
    jobsRequestId?: string;
    connectorsRequestId?: string;
};

function normalizeLines(s: string) {
    return s
        .split(/\r?\n/g)
        .map((x) => x.trim())
        .filter(Boolean);
}

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

function fileLabel(f: ScannedFile) {
    if (f.relative_path) return f.relative_path;
    if (f.name) return f.name;
    const p = f.path || "";
    const parts = p.split(/[/\\]+/g).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : p;
}

function fmtWhen(s?: string) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
}

function jobTone(status: Job["status"]) {
    switch (status) {
        case "succeeded":
            return "ok";
        case "failed":
            return "danger";
        case "running":
            return "info";
        case "queued":
            return "warn";
    }
}

function jobLabel(status: Job["status"]) {
    switch (status) {
        case "succeeded":
            return "SUCCEEDED";
        case "failed":
            return "FAILED";
        case "running":
            return "RUNNING";
        case "queued":
            return "QUEUED";
    }
}

export default function FolderScanPanel({ onIngested }: Props) {
    const [rootPath, setRootPath] = useState<string>("");

    const [includeGlobsText, setIncludeGlobsText] = useState<string>(["**/*"].join("\n"));
    const [excludeGlobsText, setExcludeGlobsText] = useState<string>(
        ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"].join("\n")
    );

    const [maxFiles, setMaxFiles] = useState<number>(5000);
    const [maxDepth, setMaxDepth] = useState<number>(25);

    const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

    const [files, setFiles] = useState<ScannedFile[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const [ops, setOps] = useState<OpsState>({
        connectorChecked: false,
        connectorOnline: false,
        connectors: [],
        jobs: [],
    });

    const selectedCount = useMemo(() => {
        let n = 0;
        for (const f of files) {
            if (selected[f.path]) n++;
        }
        return n;
    }, [files, selected]);

    const allSelected = useMemo(() => {
        if (files.length === 0) return false;
        return files.every((f) => !!selected[f.path]);
    }, [files, selected]);

    const anySelected = selectedCount > 0;

    const recentJobs = useMemo(() => {
        return ops.jobs
            .filter((j) => j.job_type === "folder_scan" || j.job_type === "files_ingest")
            .slice(0, 6);
    }, [ops.jobs]);

    const activeJob = useMemo(() => {
        return recentJobs.find((j) => j.status === "running" || j.status === "queued") ?? null;
    }, [recentJobs]);

    const primaryConnector = useMemo(() => {
        return ops.connectors[0] ?? null;
    }, [ops.connectors]);

    useEffect(() => {
        let cancelled = false;

        async function refreshOps() {
            try {
                const [connectorsRes, jobsRes] = await Promise.all([
                    connectorsApi.status(),
                    jobsApi.list(20),
                ]);

                if (cancelled) return;

                const connectors = connectorsRes.success ? connectorsRes.data.connectors || [] : [];
                const jobs = jobsRes.success ? jobsRes.data.jobs || [] : [];

                setOps({
                    connectorChecked: true,
                    connectorOnline: connectors.length > 0,
                    connectors,
                    jobs,
                    connectorsRequestId: connectorsRes.meta?.request_id,
                    jobsRequestId: jobsRes.meta?.request_id,
                });
            } catch {
                if (cancelled) return;

                setOps({
                    connectorChecked: true,
                    connectorOnline: false,
                    connectors: [],
                    jobs: [],
                });
            }
        }

        void refreshOps();
        const timer = setInterval(refreshOps, 3000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    function setPresetInclude(lines: string[]) {
        setIncludeGlobsText(lines.join("\n"));
    }

    function setPresetExclude(lines: string[]) {
        setExcludeGlobsText(lines.join("\n"));
    }

    async function pollJobUntilDone(jobId: string, timeoutMs = 300000) {
        const started = Date.now();

        for (; ;) {
            const res = await jobsApi.get(jobId);

            if (!res.success) {
                throw new Error(`${res.error.code}: ${res.error.message}`);
            }

            const job = res.data.job;

            if (job.status === "succeeded") return job;
            if (job.status === "failed") throw new Error(job.error || "Connector job failed.");

            if (Date.now() - started > timeoutMs) {
                throw new Error("Timed out waiting for connector job.");
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    async function doScan() {
        setScanState({ status: "scanning" });

        if (!ops.connectorOnline) {
            setScanState({
                status: "error",
                message: ops.connectorChecked
                    ? "Connector required for on-prem scanning. No connector is currently online."
                    : "Checking connector status...",
            });
            return;
        }

        const trimmedRoot = rootPath.trim();
        if (!trimmedRoot) {
            setScanState({ status: "error", message: "Please enter a folder path." });
            return;
        }

        const include_globs = normalizeLines(includeGlobsText);
        const exclude_globs = normalizeLines(excludeGlobsText);

        const create = await jobsApi.createFolderScan({
            root_paths: [trimmedRoot],
            include_globs,
            exclude_globs,
            max_files: maxFiles,
            max_depth: maxDepth,
        });

        if (!create.success) {
            setScanState({
                status: "error",
                message: `${create.error.code}: ${create.error.message}`,
                requestId: create.meta?.request_id,
            });
            return;
        }

        const jobId = create.data.job.job_id;

        try {
            const finished = await pollJobUntilDone(jobId);
            const results = Array.isArray((finished.result as any)?.results)
                ? (((finished.result as any).results as ConnectorScanResult[]) || [])
                : [];

            if (results.length === 0) {
                setScanState({
                    status: "error",
                    message: "Folder scan returned no results.",
                    requestId: jobId,
                });
                return;
            }

            const first = results[0];

            if (first.error) {
                setScanState({
                    status: "error",
                    message: first.error,
                    requestId: jobId,
                });
                return;
            }

            setScanState({
                status: "scanned",
                result: first,
                requestId: jobId,
            });

            setFiles(first.files || []);

            const next: Record<string, boolean> = {};
            for (const f of first.files || []) {
                next[f.path] = true;
            }
            setSelected(next);
        } catch (e: any) {
            setScanState({
                status: "error",
                message: e?.message || "Scan failed.",
                requestId: jobId,
            });
        }
    }

    async function doPrepare() {
        if (!anySelected) return;
    }

    async function doIngest() {
        if (!anySelected) return;

        if (!ops.connectorOnline) {
            setScanState({
                status: "error",
                message: "Connector required for on-prem ingest. No connector is currently online.",
            });
            return;
        }

        const chosen = files.filter((f) => selected[f.path]).map((f) => f.path);

        const create = await jobsApi.createFilesIngest({
            paths: chosen,
            max_chars: 5000,
        });

        if (!create.success) {
            setScanState({
                status: "error",
                message: `${create.error.code}: ${create.error.message}`,
                requestId: create.meta?.request_id,
            });
            return;
        }

        const jobId = create.data.job.job_id;

        try {
            const finished = await pollJobUntilDone(jobId, 600000);
            const result = (finished.result || {}) as any;

            const entryIds: number[] = Array.isArray(result.entry_ids) ? result.entry_ids : [];
            const rawMap = (result.entry_id_to_path || {}) as Record<string, string>;
            const entryIdToPath: Record<number, string> = {};

            for (const [k, v] of Object.entries(rawMap)) {
                const n = Number(k);
                if (Number.isFinite(n)) {
                    entryIdToPath[n] = v;
                }
            }

            const evt: FolderScanIngestedEvent = {
                requestId: jobId,
                entryIds,
                entryIdToPath,
                filesRequested: chosen.length,
                filesIngested: typeof result.files_ingested === "number" ? result.files_ingested : undefined,
                chunksIngested: typeof result.chunks_ingested === "number" ? result.chunks_ingested : undefined,
                scan: {
                    rootPath: rootPath.trim(),
                    includeGlobs: normalizeLines(includeGlobsText),
                    excludeGlobs: normalizeLines(excludeGlobsText),
                    maxFiles,
                    maxDepth,
                    scannedCount: files.length,
                    scanRequestId: scanState.status === "scanned" ? scanState.requestId : undefined,
                },
            };

            if (onIngested) {
                await onIngested(evt);
            }
        } catch (e: any) {
            setScanState({
                status: "error",
                message: e?.message || "Ingest failed.",
                requestId: jobId,
            });
        }
    }

    return (
        <TitanCard className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-xl font-extrabold text-white">Auto Detect</div>
                    <div className="mt-1 text-sm text-slate-300">
                        Scan a server-side folder through the Connector, then ingest selected files.
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <TitanButton onClick={doScan} disabled={!rootPath || scanState.status === "scanning" || !ops.connectorOnline}>
                        {scanState.status === "scanning" ? "Scanning…" : "Scan"}
                    </TitanButton>

                    <TitanButton variant="secondary" onClick={doPrepare} disabled={!anySelected || scanState.status === "scanning"}>
                        Prepare ({selectedCount})
                    </TitanButton>

                    <TitanButton variant="secondary" onClick={doIngest} disabled={!anySelected || scanState.status === "scanning" || !ops.connectorOnline}>
                        Ingest ({selectedCount})
                    </TitanButton>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">Connector Health</div>
                        <StatusPill
                            label={ops.connectorOnline ? "ONLINE" : ops.connectorChecked ? "OFFLINE" : "CHECKING"}
                            tone={ops.connectorOnline ? "ok" : ops.connectorChecked ? "danger" : "info"}
                        />
                    </div>

                    <div className="mt-3 text-sm text-slate-300">
                        {primaryConnector ? (
                            <>
                                <div className="break-words">
                                    Name: <span className="font-semibold text-white">{primaryConnector.name}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    OS: <span className="font-semibold text-white">{primaryConnector.os}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    Last seen: <span className="font-semibold text-white">{fmtWhen(primaryConnector.last_seen)}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    Version: <span className="font-semibold text-white">{String(primaryConnector.meta?.version ?? "—")}</span>
                                </div>
                            </>
                        ) : (
                            <div>No connector is currently online.</div>
                        )}
                    </div>

                    <div className="mt-3 text-xs text-slate-400 break-words">
                        request_id: {ops.connectorsRequestId ?? "—"}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">Current Job State</div>
                        <StatusPill
                            label={activeJob ? jobLabel(activeJob.status) : "IDLE"}
                            tone={activeJob ? jobTone(activeJob.status) : "muted"}
                        />
                    </div>

                    <div className="mt-3 text-sm text-slate-300">
                        {activeJob ? (
                            <>
                                <div className="break-words">
                                    Job Type: <span className="font-semibold text-white">{activeJob.job_type}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    Job ID: <span className="font-semibold text-white">{activeJob.job_id}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    Updated: <span className="font-semibold text-white">{fmtWhen(activeJob.updated_at)}</span>
                                </div>
                            </>
                        ) : (
                            <div>No active queued/running jobs.</div>
                        )}
                    </div>

                    <div className="mt-3 text-xs text-slate-400 break-words">
                        request_id: {ops.jobsRequestId ?? "—"}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Latest Operation</div>

                    <div className="mt-3 text-sm text-slate-300">
                        {scanState.status === "idle" && <div>Waiting for action.</div>}
                        {scanState.status === "scanning" && <div>Folder scan is in progress…</div>}
                        {scanState.status === "scanned" && (
                            <>
                                <div className="break-words">
                                    Last scan files:{" "}
                                    <span className="font-semibold text-white">{scanState.result.files_found}</span>
                                </div>
                                <div className="mt-1 break-words">
                                    Scan job: <span className="font-semibold text-white">{scanState.requestId ?? "—"}</span>
                                </div>
                            </>
                        )}
                        {scanState.status === "error" && (
                            <>
                                <div className="text-rose-200 break-words">{scanState.message}</div>
                                <div className="mt-1 break-words">
                                    request_id/job_id: <span className="font-semibold text-white">{scanState.requestId ?? "—"}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Recent Connector Jobs</div>
                    <div className="text-xs text-slate-400">Latest folder scan / files ingest jobs</div>
                </div>

                {recentJobs.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-300">No recent connector jobs yet.</div>
                ) : (
                    <div className="mt-3 grid gap-2">
                        {recentJobs.map((j) => (
                            <div key={j.job_id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <StatusPill label={jobLabel(j.status)} tone={jobTone(j.status)} />
                                        <span className="text-sm font-semibold text-white">{j.job_type}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">{fmtWhen(j.updated_at)}</div>
                                </div>

                                <div className="mt-2 text-xs text-slate-300 break-words">job_id: {j.job_id}</div>

                                {j.error ? (
                                    <div className="mt-2 text-xs text-rose-200 break-words">{j.error}</div>
                                ) : null}

                                {j.logs?.length ? (
                                    <div className="mt-2 text-xs text-slate-400 break-words">
                                        latest log: {j.logs[j.logs.length - 1]}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TitanCard className="space-y-3" bodyClassName="space-y-3">
                    <div className="text-sm font-semibold text-white">Folder path</div>
                    <input
                        value={rootPath}
                        onChange={(e) => setRootPath(e.target.value)}
                        placeholder="C:\HerraData"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                    />

                    <div className="text-xs text-slate-400">
                        This path must exist on the connector machine, not on the laptop running the backend.
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <div className="text-sm font-semibold text-white">Include globs</div>
                            <textarea
                                value={includeGlobsText}
                                onChange={(e) => setIncludeGlobsText(e.target.value)}
                                rows={6}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                            />
                        </div>

                        <div>
                            <div className="text-sm font-semibold text-white">Exclude globs</div>
                            <textarea
                                value={excludeGlobsText}
                                onChange={(e) => setExcludeGlobsText(e.target.value)}
                                rows={6}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <TitanButton variant="secondary" onClick={() => setPresetInclude(["**/*"])}>
                            Include all
                        </TitanButton>

                        <TitanButton
                            variant="secondary"
                            onClick={() => setPresetInclude(["**/*.txt", "**/*.md", "**/*.json", "**/*.csv"])}
                        >
                            Text only
                        </TitanButton>

                        <TitanButton
                            variant="secondary"
                            onClick={() => setPresetExclude(["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"])}
                        >
                            Common excludes
                        </TitanButton>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <div className="text-sm font-semibold text-white">Max files</div>
                            <input
                                type="number"
                                value={maxFiles}
                                onChange={(e) => setMaxFiles(parseInt(e.target.value || "0", 10))}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                            />
                        </div>

                        <div>
                            <div className="text-sm font-semibold text-white">Max depth</div>
                            <input
                                type="number"
                                value={maxDepth}
                                onChange={(e) => setMaxDepth(parseInt(e.target.value || "0", 10))}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                            />
                        </div>
                    </div>

                    {scanState.status === "error" ? (
                        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                            <div className="font-semibold">Error</div>
                            <div className="mt-1 break-words">{scanState.message}</div>
                            {scanState.requestId ? (
                                <div className="mt-2 text-xs text-slate-300">request_id: {scanState.requestId}</div>
                            ) : null}
                        </div>
                    ) : null}

                    {scanState.status === "scanned" ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                            <div className="font-semibold text-white">Scan complete</div>
                            <div className="mt-1">
                                {scanState.result.files_found} unique file(s)
                            </div>
                            {scanState.requestId ? (
                                <div className="mt-2 text-xs text-slate-400">job_id: {scanState.requestId}</div>
                            ) : null}
                        </div>
                    ) : null}
                </TitanCard>

                <TitanCard className="space-y-3" bodyClassName="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">Files</div>

                        <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    const next: Record<string, boolean> = {};
                                    for (const f of files) next[f.path] = checked;
                                    setSelected(next);
                                }}
                                className="h-4 w-4 accent-cyan-400"
                            />
                            Select all
                        </label>
                    </div>

                    <div className="h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {files.length === 0 ? (
                            <div className="text-sm text-slate-300">No files yet. Run Scan.</div>
                        ) : (
                            <div className="space-y-2">
                                {files.map((f) => {
                                    const checked = !!selected[f.path];
                                    return (
                                        <label
                                            key={f.path}
                                            className={cx(
                                                "flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2",
                                                checked ? "outline outline-1 outline-cyan-400/20" : ""
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) =>
                                                    setSelected((prev) => ({
                                                        ...prev,
                                                        [f.path]: e.target.checked,
                                                    }))
                                                }
                                                className="mt-1 h-4 w-4 accent-cyan-400"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white">{fileLabel(f)}</div>
                                                <div className="text-xs text-slate-400 break-all">{f.path}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                        <div>
                            Selected: <span className="font-semibold text-slate-100">{selectedCount}</span>
                        </div>
                        <StatusPill label={anySelected ? "READY" : "NONE"} tone={anySelected ? "ok" : "warn"} />
                    </div>
                </TitanCard>
            </div>
        </TitanCard>
    );
}