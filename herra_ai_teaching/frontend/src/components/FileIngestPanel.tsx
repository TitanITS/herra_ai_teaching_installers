import { useMemo, useState } from "react";
import TitanButton from "./TitanButton";

export type FileIngestPanelIngestedEvent = {
    requestId: string;
    entryIds: number[];
    entryIdToPath: Record<number, string>;
    filesRequested: number;
    filesIngested?: number;
    chunksIngested?: number;
};

type ApiEnvelope<T> =
    | { success: true; data: T; message: string | null; meta: { request_id: string; timestamp: string } }
    | {
        success: false;
        error: { code: string; message: string; details?: Record<string, unknown> };
        message: string | null;
        meta?: { request_id?: string; timestamp?: string };
    };

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

async function apiPost<T>(path: string, body: unknown): Promise<ApiEnvelope<T>> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return (await res.json()) as ApiEnvelope<T>;
}

function pretty(obj: unknown) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return String(obj);
    }
}

function stripWrappingQuotes(s: string) {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1).trim();
    }
    return t;
}

type FilesIngestResp = {
    status?: string;
    files_ingested?: number;
    chunks_ingested?: number;
    skipped_files?: number;
    results?: Array<{
        status?: string;
        reason?: string;
        message?: string;
        source?: { path?: string; resolved_path?: string };
        entry_ids?: number[];
    }>;
    entry_ids?: number[];
};

function extractEntryIdsAndPaths(data: unknown): { entryIds: number[]; entryIdToPath: Record<number, string> } {
    const entryIds: number[] = [];
    const entryIdToPath: Record<number, string> = {};

    const d: any = data;
    const results: any[] = Array.isArray(d?.results) ? d.results : [];

    if (Array.isArray(d?.entry_ids)) {
        for (const id of d.entry_ids) {
            if (typeof id === "number") {
                entryIds.push(id);
            }
        }
    }

    for (const r of results) {
        const ids = Array.isArray(r?.entry_ids) ? r.entry_ids : [];
        const p = r?.source?.path ?? r?.source?.resolved_path ?? "";

        for (const id of ids) {
            if (typeof id === "number") {
                entryIds.push(id);
                if (p) {
                    entryIdToPath[id] = p;
                }
            }
        }
    }

    return {
        entryIds: Array.from(new Set(entryIds)),
        entryIdToPath,
    };
}

export default function FileIngestPanel({
    onIngested,
}: {
    onIngested?: (evt: FileIngestPanelIngestedEvent) => void;
}) {
    const [path, setPath] = useState("");
    const [maxChars, setMaxChars] = useState<number>(5000);

    const [pathsText, setPathsText] = useState("");
    const [multiMaxChars, setMultiMaxChars] = useState<number>(5000);

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [raw, setRaw] = useState<string | null>(null);

    const paths = useMemo(() => {
        return pathsText
            .split(/\r?\n/g)
            .map((s) => stripWrappingQuotes(s))
            .map((s) => s.trim())
            .filter(Boolean);
    }, [pathsText]);

    async function doSinglePrepare() {
        const p = stripWrappingQuotes(path);
        if (!p) {
            setMsg("Please paste a file path first.");
            return;
        }

        setBusy(true);
        setMsg(null);
        setRaw(null);

        try {
            const res = await apiPost<Record<string, unknown>>("/system/file/prepare", {
                path: p,
                max_chars: Number.isFinite(maxChars) ? maxChars : 5000,
            });

            if (!res.success) {
                setMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
                setBusy(false);
                return;
            }

            setMsg(`Prepared single file. request_id: ${res.meta.request_id}`);
            setRaw(pretty(res.data));
            setBusy(false);
        } catch {
            setMsg(`CLIENT_ERROR: Network error (is backend running at ${API_BASE} ?)`);
            setBusy(false);
        }
    }

    async function doSingleIngest() {
        const p = stripWrappingQuotes(path);
        if (!p) {
            setMsg("Please paste a file path first.");
            return;
        }

        setBusy(true);
        setMsg(null);
        setRaw(null);

        try {
            const res = await apiPost<FilesIngestResp>("/system/file/ingest", {
                path: p,
                max_chars: Number.isFinite(maxChars) ? maxChars : undefined,
            });

            if (!res.success) {
                setMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
                setBusy(false);
                return;
            }

            setMsg(`Ingested single file. request_id: ${res.meta.request_id}`);
            setRaw(pretty(res.data));

            const { entryIds, entryIdToPath } = extractEntryIdsAndPaths(res.data);

            onIngested?.({
                requestId: res.meta.request_id,
                entryIds,
                entryIdToPath,
                filesRequested: 1,
                filesIngested: typeof (res.data as any)?.files_ingested === "number" ? (res.data as any).files_ingested : undefined,
                chunksIngested: typeof (res.data as any)?.chunks_ingested === "number" ? (res.data as any).chunks_ingested : undefined,
            });

            setBusy(false);
        } catch {
            setMsg(`CLIENT_ERROR: Network error (is backend running at ${API_BASE} ?)`);
            setBusy(false);
        }
    }

    async function doMultiPrepare() {
        if (paths.length === 0) {
            setMsg("Please paste at least one file path, one per line.");
            return;
        }

        setBusy(true);
        setMsg(null);
        setRaw(null);

        try {
            const res = await apiPost<Record<string, unknown>>("/system/files/prepare", {
                paths,
                max_chars: Number.isFinite(multiMaxChars) ? multiMaxChars : 5000,
            });

            if (!res.success) {
                setMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
                setBusy(false);
                return;
            }

            setMsg(`Prepared ${paths.length} file(s). request_id: ${res.meta.request_id}`);
            setRaw(pretty(res.data));
            setBusy(false);
        } catch {
            setMsg(`CLIENT_ERROR: Network error (is backend running at ${API_BASE} ?)`);
            setBusy(false);
        }
    }

    async function doMultiIngest() {
        if (paths.length === 0) {
            setMsg("Please paste at least one file path, one per line.");
            return;
        }

        setBusy(true);
        setMsg(null);
        setRaw(null);

        try {
            const res = await apiPost<FilesIngestResp>("/system/files/ingest", {
                paths,
                max_chars: Number.isFinite(multiMaxChars) ? multiMaxChars : undefined,
            });

            if (!res.success) {
                setMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
                setBusy(false);
                return;
            }

            setMsg(`Ingested ${paths.length} file(s). request_id: ${res.meta.request_id}`);
            setRaw(pretty(res.data));

            const { entryIds, entryIdToPath } = extractEntryIdsAndPaths(res.data);

            onIngested?.({
                requestId: res.meta.request_id,
                entryIds,
                entryIdToPath,
                filesRequested: paths.length,
                filesIngested: typeof (res.data as any)?.files_ingested === "number" ? (res.data as any).files_ingested : undefined,
                chunksIngested: typeof (res.data as any)?.chunks_ingested === "number" ? (res.data as any).chunks_ingested : undefined,
            });

            setBusy(false);
        } catch {
            setMsg(`CLIENT_ERROR: Network error (is backend running at ${API_BASE} ?)`);
            setBusy(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">Single file path</div>
                <div className="mt-1 text-xs text-slate-400">Use this when you want to prepare or ingest one file directly.</div>

                <input
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder={"C:\\path\\to\\file.py"}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    disabled={busy}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-300">max_chars</label>
                    <input
                        type="number"
                        value={maxChars}
                        onChange={(e) => setMaxChars(Number(e.target.value))}
                        className="w-32 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                        disabled={busy}
                        min={1}
                    />

                    <div className="flex flex-wrap gap-2">
                        <TitanButton variant="secondary" onClick={doSinglePrepare} disabled={busy}>
                            {busy ? "Working..." : "Prepare"}
                        </TitanButton>
                        <TitanButton variant="primary" onClick={doSingleIngest} disabled={busy}>
                            {busy ? "Working..." : "Ingest"}
                        </TitanButton>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">Batch file paths</div>
                <div className="mt-1 text-xs text-slate-400">Paste one file path per line for batch prepare or ingest.</div>

                <textarea
                    value={pathsText}
                    onChange={(e) => setPathsText(e.target.value)}
                    placeholder={"C:\\path\\to\\file1.py\nC:\\path\\to\\file2.ts"}
                    rows={6}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    disabled={busy}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-300">max_chars</label>
                    <input
                        type="number"
                        value={multiMaxChars}
                        onChange={(e) => setMultiMaxChars(Number(e.target.value))}
                        className="w-32 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                        disabled={busy}
                        min={1}
                    />

                    <div className="flex flex-wrap gap-2">
                        <TitanButton variant="secondary" onClick={doMultiPrepare} disabled={busy}>
                            {busy ? "Working..." : `Prepare (${paths.length})`}
                        </TitanButton>
                        <TitanButton variant="primary" onClick={doMultiIngest} disabled={busy}>
                            {busy ? "Working..." : `Ingest (${paths.length})`}
                        </TitanButton>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">API Output</div>
                    {msg ? <div className="text-xs text-slate-300">Latest response available below</div> : null}
                </div>

                {msg ? <div className="mt-3 text-sm text-slate-200 break-words">{msg}</div> : <div className="mt-3 text-sm text-slate-400">No output yet.</div>}

                <div className="mt-3 max-h-[260px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3">
                    {raw ? (
                        <pre className="whitespace-pre-wrap text-xs text-slate-200">{raw}</pre>
                    ) : (
                        <div className="text-xs text-slate-500">Prepared and ingested responses will appear here.</div>
                    )}
                </div>
            </div>
        </div>
    );
}