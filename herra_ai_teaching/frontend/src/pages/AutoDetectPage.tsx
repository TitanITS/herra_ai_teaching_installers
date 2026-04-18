import { useEffect, useMemo, useState } from "react";
import TitanButton from "../components/TitanButton";
import { ingestApi } from "../features/ingest/ingestApi";
import type { IngestListEntry } from "../features/ingest/ingestTypes";
import { TitanCard } from "../components/TitanCard";
import { StatusPill } from "../components/StatusPill";
import { connectorsApi } from "../features/connectors/connectorsApi";
import { jobsApi } from "../features/jobs/jobsApi";
import type { Connector } from "../features/connectors/connectorsTypes";
import type { Job } from "../features/jobs/jobsTypes";

type LoadState =
    | { status: "idle" | "loading" }
    | { status: "error"; message: string; requestId?: string }
    | { status: "success"; entries: IngestListEntry[]; requestId: string };

type AutoRun = {
    id: string;
    createdAt: string;
    kind: "auto_folder_ingest";
    requestId?: string;
    rootPath?: string;
    includeGlobs?: string[];
    excludeGlobs?: string[];
    filesRequested?: number;
    filesIngested?: number;
    chunksIngested?: number;
    entryIds: number[];
    entryIdToPath?: Record<number, string>;
};

type OpsState = {
    connectorChecked: boolean;
    connectorOnline: boolean;
    connectors: Connector[];
    jobs: Job[];
    connectorsRequestId?: string;
    jobsRequestId?: string;
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

const RUNS_KEY = "herra.run_history.auto.v1";
const MAX_RUNS = 50;

function safeLoadRuns(): AutoRun[] {
    try {
        const raw = localStorage.getItem(RUNS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(Boolean).slice(0, MAX_RUNS);
    } catch {
        return [];
    }
}

function safeSaveRuns(runs: AutoRun[]) {
    try {
        localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
    } catch {
        // ignore storage failures
    }
}

function newRunId() {
    return `run_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function fmtWhen(s?: string) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
}

function toneForJob(status: Job["status"]) {
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

function labelForJob(status: Job["status"]) {
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

function normalizeLines(s: string) {
    return s
        .split(/\r?\n/g)
        .map((x) => x.trim())
        .filter(Boolean);
}

function fileLabel(f: ScannedFile) {
    if (f.relative_path) return f.relative_path;
    if (f.name) return f.name;
    const p = f.path || "";
    const parts = p.split(/[/\\]+/g).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : p;
}

export default function AutoDetectPage() {
    const [state, setState] = useState<LoadState>({ status: "idle" });

    const [runs, setRuns] = useState<AutoRun[]>(() => safeLoadRuns());
    const [activeRunId, setActiveRunId] = useState<string | null>(() => safeLoadRuns()[0]?.id ?? null);
    const activeRun = useMemo(() => runs.find((r) => r.id === activeRunId) ?? null, [runs, activeRunId]);

    const [detailsExpanded, setDetailsExpanded] = useState(false);

    const [penalizingId, setPenalizingId] = useState<number | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const [ops, setOps] = useState<OpsState>({
        connectorChecked: false,
        connectorOnline: false,
        connectors: [],
        jobs: [],
    });

    const [rootPath, setRootPath] = useState<string>("C:\\HerraData");
    const [includeGlobsText, setIncludeGlobsText] = useState<string>(["**/*"].join("\n"));
    const [excludeGlobsText, setExcludeGlobsText] = useState<string>(
        ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"].join("\n")
    );
    const [maxFiles, setMaxFiles] = useState<number>(5000);
    const [maxDepth, setMaxDepth] = useState<number>(25);

    const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
    const [files, setFiles] = useState<ScannedFile[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    async function load() {
        setState({ status: "loading" });

        const res = await ingestApi.list();
        if (!res.success) {
            setState({
                status: "error",
                message: `${res.error.code}: ${res.error.message}`,
                requestId: res.meta?.request_id,
            });
            return;
        }

        setState({
            status: "success",
            entries: res.data.entries,
            requestId: res.meta.request_id,
        });
    }

    async function refreshOps() {
        try {
            const [connectorsRes, jobsRes] = await Promise.all([
                connectorsApi.status(),
                jobsApi.list(20),
            ]);

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
            setOps({
                connectorChecked: true,
                connectorOnline: false,
                connectors: [],
                jobs: [],
            });
        }
    }

    useEffect(() => {
        void load();
        void refreshOps();

        const timer = setInterval(() => {
            void refreshOps();
        }, 3000);

        return () => clearInterval(timer);
    }, []);

    function pushRun(run: AutoRun) {
        const next = [run, ...runs].slice(0, MAX_RUNS);
        setRuns(next);
        setActiveRunId(run.id);
        safeSaveRuns(next);
    }

    function clearRuns() {
        setRuns([]);
        setActiveRunId(null);
        safeSaveRuns([]);
        setMsg(null);
    }

    function exportRunJson(run: AutoRun) {
        const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `herra_auto_run_${run.id}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function penalize(entryId: number) {
        setMsg(null);
        setPenalizingId(entryId);

        const res = await ingestApi.penalize(entryId);
        if (!res.success) {
            setMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
            setPenalizingId(null);
            return;
        }

        setMsg(`Penalized entry #${entryId}. request_id: ${res.meta.request_id}`);
        setPenalizingId(null);
        await load();
    }

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
            .slice(0, 12);
    }, [ops.jobs]);

    const visibleJobs = useMemo(() => {
        const active = recentJobs.filter((j) => j.status === "queued" || j.status === "running");
        const inactive = recentJobs.filter((j) => j.status !== "queued" && j.status !== "running");
        return [...active, ...inactive].slice(0, 3);
    }, [recentJobs]);

    const activeRunEntries = useMemo(() => {
        if (!activeRun) return [];
        if (state.status !== "success") return [];
        const set = new Set(activeRun.entryIds);
        return state.entries.filter((e) => set.has(e.id));
    }, [activeRun, state]);

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
        setMsg(null);
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

            await refreshOps();
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
        setMsg(`Prepared ${selectedCount} selected file(s) for ingest.`);
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

            const run: AutoRun = {
                id: newRunId(),
                createdAt: new Date().toISOString(),
                kind: "auto_folder_ingest",
                requestId: jobId,
                rootPath: rootPath.trim(),
                includeGlobs: normalizeLines(includeGlobsText),
                excludeGlobs: normalizeLines(excludeGlobsText),
                filesRequested: chosen.length,
                filesIngested: typeof result.files_ingested === "number" ? result.files_ingested : undefined,
                chunksIngested: typeof result.chunks_ingested === "number" ? result.chunks_ingested : undefined,
                entryIds,
                entryIdToPath,
            };

            pushRun(run);
            setMsg(`Auto ingest complete. Entries: ${run.entryIds.join(", ") || "—"}`);

            await load();
            await refreshOps();
        } catch (e: any) {
            setScanState({
                status: "error",
                message: e?.message || "Ingest failed.",
                requestId: jobId,
            });
        }
    }

    return (
        <div className="w-full max-w-none space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 xl:w-[48%]">
                    <div className="text-3xl font-extrabold text-white">Auto Detect</div>
                    <div className="mt-1 text-sm text-slate-300">
                        Scan a server-side folder through the Connector, then ingest selected files.
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:w-[40%] xl:justify-end">
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard
                    title="Folder Path"
                    subtitle="This path must exist on the connector machine, not on the laptop running the backend."
                    bodyClassName="space-y-3"
                >
                    <input
                        value={rootPath}
                        onChange={(e) => setRootPath(e.target.value)}
                        placeholder="C:\HerraData"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40"
                    />

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
                        <TitanButton variant="secondary" onClick={() => setIncludeGlobsText(["**/*"].join("\n"))}>
                            Include all
                        </TitanButton>

                        <TitanButton
                            variant="secondary"
                            onClick={() => setIncludeGlobsText(["**/*.txt", "**/*.md", "**/*.json", "**/*.csv"].join("\n"))}
                        >
                            Text only
                        </TitanButton>

                        <TitanButton
                            variant="secondary"
                            onClick={() =>
                                setExcludeGlobsText(["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"].join("\n"))
                            }
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

                <TitanCard title="Files" subtitle="Select files to prepare and ingest" bodyClassName="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-300">
                            Selected: <span className="font-semibold text-slate-100">{selectedCount}</span>
                        </div>

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

                    <div className="h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {files.length === 0 ? (
                            <div className="text-sm text-slate-300">No files yet. Run Scan.</div>
                        ) : (
                            <div className="space-y-2">
                                {files.map((f) => {
                                    const checked = !!selected[f.path];
                                    return (
                                        <label
                                            key={f.path}
                                            className={[
                                                "flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2",
                                                checked ? "outline outline-1 outline-cyan-400/20" : "",
                                            ].join(" ")}
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
                </TitanCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard title="Job Visibility" subtitle="Up to 3 jobs shown here. This panel scrolls independently." bodyClassName="space-y-3">
                    <div className="h-[250px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {visibleJobs.length === 0 ? (
                            <div className="text-sm text-slate-300">No connector jobs have run yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {visibleJobs.map((j) => (
                                    <div key={j.job_id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-sm font-semibold text-white">{j.job_type}</div>
                                            <StatusPill label={labelForJob(j.status)} tone={toneForJob(j.status)} />
                                        </div>

                                        <div className="mt-2 text-xs text-slate-400 break-words">job_id: {j.job_id}</div>
                                        <div className="mt-1 text-xs text-slate-400">updated: {fmtWhen(j.updated_at)}</div>

                                        {j.error ? (
                                            <div className="mt-2 text-xs text-rose-200 break-words">{j.error}</div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TitanCard>

                <TitanCard title="Auto Ingest Complete" subtitle="Latest auto-ingest result. Entry IDs are listed vertically." bodyClassName="space-y-3">
                    <div className="h-[250px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {!activeRun ? (
                            <div className="text-sm text-slate-300">No auto-ingest run selected yet.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">job_id</div>
                                        <div className="mt-1 text-sm font-semibold text-white break-words">{activeRun.requestId ?? "—"}</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">root path</div>
                                        <div className="mt-1 text-sm text-white break-words">{activeRun.rootPath ?? "—"}</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">files requested</div>
                                        <div className="mt-1 text-sm font-semibold text-white">{activeRun.filesRequested ?? 0}</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">files ingested</div>
                                        <div className="mt-1 text-sm font-semibold text-white">{activeRun.filesIngested ?? 0}</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:col-span-2">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">chunks ingested</div>
                                        <div className="mt-1 text-sm font-semibold text-white">{activeRun.chunksIngested ?? 0}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400">entry ids</div>
                                    <div className="mt-2 space-y-1 text-sm text-white">
                                        {activeRun.entryIds.length === 0 ? (
                                            <div>—</div>
                                        ) : (
                                            activeRun.entryIds.map((id) => (
                                                <div key={id}>#{id}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </TitanCard>
            </div>

            {msg ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 break-words">
                    {msg}
                </div>
            ) : null}

            <TitanCard
                title="Recent Connector History (Auto runs)"
                subtitle="This is the single historical view for Auto Detect runs."
                right={
                    <div className="flex flex-wrap gap-2">
                        <TitanButton variant="secondary" onClick={() => setDetailsExpanded((v) => !v)}>
                            {detailsExpanded ? "Minimize details" : "Maximize details"}
                        </TitanButton>
                        <TitanButton variant="secondary" onClick={clearRuns}>
                            Clear history
                        </TitanButton>
                        {activeRun ? (
                            <TitanButton variant="secondary" onClick={() => exportRunJson(activeRun)}>
                                Export run JSON
                            </TitanButton>
                        ) : null}
                        <TitanButton
                            variant="secondary"
                            onClick={async () => {
                                await load();
                                await refreshOps();
                            }}
                        >
                            Refresh list
                        </TitanButton>
                    </div>
                }
                bodyClassName="space-y-4"
            >
                {runs.length === 0 ? (
                    <div className="text-sm text-slate-300">No auto runs yet.</div>
                ) : (
                    <div className={detailsExpanded ? "grid gap-3 lg:grid-cols-1" : "grid gap-3 lg:grid-cols-3"}>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold text-slate-200">Runs</div>
                                <StatusPill label={`${runs.length} saved`} tone="ok" />
                            </div>

                            <div className="mt-2 space-y-2 max-h-[480px] overflow-y-auto">
                                {runs.map((r) => {
                                    const isActive = r.id === activeRunId;
                                    const title = `Folder → ${r.entryIds.length} entries`;
                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => setActiveRunId(r.id)}
                                            className={[
                                                "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                                                isActive
                                                    ? "border-cyan-300/60 bg-cyan-300/10 text-white"
                                                    : "border-white/10 bg-black/20 text-slate-200 hover:bg-black/30",
                                            ].join(" ")}
                                        >
                                            <div className="font-semibold">{title}</div>
                                            <div className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
                                            <div className="mt-1 text-[11px] text-slate-500 break-words">
                                                root: {r.rootPath ?? "—"}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            className={
                                detailsExpanded
                                    ? "rounded-2xl border border-white/10 bg-black/20 p-3"
                                    : "lg:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-3"
                            }
                        >
                            <div className="text-xs font-semibold text-slate-200">Selected run</div>

                            {!activeRun ? (
                                <div className="mt-2 text-sm text-slate-300">Select a run.</div>
                            ) : (
                                <div className="mt-3 space-y-4">
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">job_id</div>
                                            <div className="mt-1 text-sm font-semibold text-white break-words">{activeRun.requestId ?? "—"}</div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">files requested</div>
                                            <div className="mt-1 text-sm font-semibold text-white">{activeRun.filesRequested ?? 0}</div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">files ingested</div>
                                            <div className="mt-1 text-sm font-semibold text-white">{activeRun.filesIngested ?? 0}</div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">chunks ingested</div>
                                            <div className="mt-1 text-sm font-semibold text-white">{activeRun.chunksIngested ?? 0}</div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">root path</div>
                                            <div className="mt-1 text-sm text-white break-words">{activeRun.rootPath ?? "—"}</div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">include globs</div>
                                            <div className="mt-1 text-sm text-white break-words">
                                                {(activeRun.includeGlobs ?? []).join(", ") || "—"}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-400">exclude globs</div>
                                            <div className="mt-1 text-sm text-white break-words">
                                                {(activeRun.excludeGlobs ?? []).join(", ") || "—"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-xs font-semibold text-slate-200">Entries from selected run</div>
                                            <StatusPill label={`${activeRunEntries.length} visible`} tone="info" />
                                        </div>

                                        {state.status === "loading" ? (
                                            <div className="mt-3 text-sm text-slate-300">Loading entries…</div>
                                        ) : state.status === "error" ? (
                                            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                                                {state.message}
                                            </div>
                                        ) : activeRunEntries.length === 0 ? (
                                            <div className="mt-3 text-sm text-slate-300">No entries found for this run.</div>
                                        ) : (
                                            <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto">
                                                {activeRunEntries.map((e) => {
                                                    const srcPath = activeRun.entryIdToPath?.[e.id];

                                                    return (
                                                        <div key={e.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold text-white">#{e.id}</span>
                                                                        {e.penalized ? (
                                                                            <StatusPill label="PENALIZED" tone="warn" />
                                                                        ) : (
                                                                            <StatusPill label="ACTIVE" tone="ok" />
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-slate-400">{e.created_at}</div>
                                                                    {srcPath ? (
                                                                        <div className="mt-1 text-xs text-slate-500 break-words">
                                                                            {srcPath}
                                                                        </div>
                                                                    ) : null}
                                                                </div>

                                                                <TitanButton
                                                                    variant="danger"
                                                                    onClick={() => penalize(e.id)}
                                                                    disabled={penalizingId === e.id || e.penalized}
                                                                >
                                                                    {penalizingId === e.id ? "Penalizing…" : e.penalized ? "Penalized" : "Penalize"}
                                                                </TitanButton>
                                                            </div>

                                                            <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-100">
                                                                {e.text}
                                                            </pre>

                                                            <div className="mt-3 text-xs text-slate-400">
                                                                tokens: {e.tokens} | penalized: {String(e.penalized)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </TitanCard>
        </div>
    );
}