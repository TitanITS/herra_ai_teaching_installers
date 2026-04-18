import { useEffect, useMemo, useState } from "react";
import FileIngestPanel, { type FileIngestPanelIngestedEvent } from "../components/FileIngestPanel";
import TitanButton from "../components/TitanButton";
import TitanCard from "../components/TitanCard";
import StatusPill from "../components/StatusPill";
import { ingestApi } from "../features/ingest/ingestApi";
import type { IngestListEntry } from "../features/ingest/ingestTypes";

type RunItem = {
    id: number;
    ts: string;
    kind: "text" | "files";
    ok: boolean;
    summary: string;
    requestId?: string;
};

export default function IngestListPage() {
    const [entries, setEntries] = useState<IngestListEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const [newText, setNewText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState("");

    const [penalizingId, setPenalizingId] = useState<number | undefined>(undefined);
    const [penalizeMsg, setPenalizeMsg] = useState("");

    const [runHistory, setRunHistory] = useState<RunItem[]>([]);
    const [highlightIds, setHighlightIds] = useState<number[]>([]);
    const [entryIdToPath, setEntryIdToPath] = useState<Record<number, string>>({});

    const highlightSet = useMemo(() => new Set(highlightIds), [highlightIds]);

    function pushRun(item: Omit<RunItem, "id" | "ts">) {
        setRunHistory((prev) => [
            {
                id: Date.now() + Math.floor(Math.random() * 1000),
                ts: new Date().toLocaleString(),
                ...item,
            },
            ...prev,
        ]);
    }

    async function load() {
        setLoading(true);

        const res = await ingestApi.list();

        setLoading(false);

        if (!res.success) {
            setSubmitMsg(`${res.error.code}: ${res.error.message}`);
            return;
        }

        setEntries(res.data.entries);
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleSubmitText() {
        const payload = newText.trim();
        if (!payload) {
            setSubmitMsg("Please enter some text first.");
            return;
        }

        setSubmitting(true);
        setSubmitMsg("");
        setPenalizeMsg("");

        const res = await ingestApi.ingestText({ text: payload });

        setSubmitting(false);

        if (!res.success) {
            setSubmitMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
            pushRun({
                kind: "text",
                ok: false,
                summary: `${res.error.code}: ${res.error.message}`,
                requestId: res.meta?.request_id,
            });
            return;
        }

        const savedId = res.data.entry_id;
        const requestId = res.meta?.request_id;

        setSubmitMsg(`Saved entry #${savedId ?? "?"} (request_id: ${requestId ?? "?"})`);
        pushRun({
            kind: "text",
            ok: true,
            summary: `Saved entry #${savedId ?? "?"}`,
            requestId,
        });

        setNewText("");

        if (typeof savedId === "number") {
            setHighlightIds([savedId]);
        } else {
            setHighlightIds([]);
        }

        setEntryIdToPath({});
        await load();
    }

    async function penalize(entryId: number) {
        setPenalizeMsg("");
        setSubmitMsg("");
        setPenalizingId(entryId);

        const res = await ingestApi.penalize(entryId);

        setPenalizingId(undefined);

        if (!res.success) {
            setPenalizeMsg(`${res.error.code}: ${res.error.message} (request_id: ${res.meta?.request_id ?? "?"})`);
            return;
        }

        setPenalizeMsg(`Penalized entry #${entryId} (request_id: ${res.meta?.request_id ?? "?"})`);
        await load();
    }

    async function onFilesIngested(evt: FileIngestPanelIngestedEvent) {
        setSubmitMsg("");
        setPenalizeMsg("");

        setHighlightIds(evt.entryIds);
        setEntryIdToPath(evt.entryIdToPath ?? {});

        pushRun({
            kind: "files",
            ok: true,
            summary: `Ingested ${evt.entryIds.length} entr${evt.entryIds.length === 1 ? "y" : "ies"}`,
            requestId: evt.requestId,
        });

        await load();
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 xl:w-[55%]">
                    <div className="text-3xl font-extrabold text-white">Ingest</div>
                    <div className="mt-1 text-sm text-slate-300">
                        Manually prepare and ingest files, add direct text snippets, and review registry entries.
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Registry entries</div>
                        <div className="mt-1 text-xl font-bold text-white">{entries.length}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Manual runs</div>
                        <div className="mt-1 text-xl font-bold text-white">{runHistory.length}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard
                    title="Manual File Ingest"
                    subtitle="Single-file and batch file-path workflows for direct operator control."
                    bodyClassName="space-y-4"
                >
                    <FileIngestPanel onIngested={onFilesIngested} />
                </TitanCard>

                <TitanCard
                    title="Manual Text Ingest"
                    subtitle="Save direct text into the ingest registry without using a file path."
                    bodyClassName="space-y-4"
                >
                    <textarea
                        className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-400/40"
                        placeholder="Type or paste text here..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <TitanButton onClick={handleSubmitText} disabled={submitting || !newText.trim()}>
                            {submitting ? "Saving..." : "Save Text"}
                        </TitanButton>

                        <TitanButton variant="secondary" onClick={() => void load()} disabled={loading}>
                            {loading ? "Refreshing..." : "Refresh Registry"}
                        </TitanButton>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        {submitMsg ? (
                            <div className="text-sm text-white/80 break-words">{submitMsg}</div>
                        ) : (
                            <div className="text-sm text-slate-400">Manual text save results will appear here.</div>
                        )}

                        {penalizeMsg ? (
                            <div className="mt-3 text-sm text-white/80 break-words">{penalizeMsg}</div>
                        ) : null}
                    </div>
                </TitanCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TitanCard
                    title="Manual Run History"
                    subtitle="Latest manual actions from this page only."
                    bodyClassName="space-y-2"
                >
                    <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {runHistory.length === 0 ? (
                            <div className="text-sm text-white/60">No manual runs yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {runHistory.slice(0, 25).map((r) => (
                                    <div key={r.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <StatusPill status={r.ok ? "ok" : "danger"} />
                                                <span className="text-sm font-semibold text-white/90">
                                                    {r.kind === "files" ? "Files" : "Text"}
                                                </span>
                                            </div>
                                            <div className="text-xs text-white/50">{r.ts}</div>
                                        </div>

                                        <div className="mt-1 text-sm text-white/80 break-words">
                                            {r.summary}
                                            {r.requestId ? (
                                                <span className="text-white/50"> (request_id: {r.requestId})</span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TitanCard>

                <TitanCard
                    title="Loaded Registry Entries"
                    subtitle="Latest items currently available in the ingest registry."
                    bodyClassName="space-y-2"
                >
                    <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                        {loading ? (
                            <div className="text-sm text-white/60">Loading…</div>
                        ) : entries.length === 0 ? (
                            <div className="text-sm text-white/60">No entries found.</div>
                        ) : (
                            <div className="space-y-2">
                                {entries.map((e) => {
                                    const isHi = highlightSet.has(e.id);
                                    const pathHint = entryIdToPath[e.id];

                                    return (
                                        <div
                                            key={e.id}
                                            className={`rounded-xl border p-3 ${isHi ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-black/25"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-white/90">#{e.id}</span>
                                                        {e.penalized ? (
                                                            <StatusPill status="warn" label="Penalized" />
                                                        ) : (
                                                            <StatusPill status="ok" label="Active" />
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-white/55">{e.created_at}</div>

                                                    {pathHint ? (
                                                        <div className="mt-1 text-xs text-white/60 break-words">
                                                            Path: {pathHint}
                                                        </div>
                                                    ) : null}

                                                    <div className="mt-2 whitespace-pre-wrap break-words text-sm text-white/80">
                                                        {e.text}
                                                    </div>

                                                    <div className="mt-2 text-xs text-white/50">
                                                        tokens: {e.tokens} | penalized: {String(e.penalized)}
                                                    </div>
                                                </div>

                                                <div className="shrink-0">
                                                    <TitanButton
                                                        variant="danger"
                                                        onClick={() => void penalize(e.id)}
                                                        disabled={penalizingId === e.id}
                                                    >
                                                        {penalizingId === e.id ? "Penalizing..." : "Penalize"}
                                                    </TitanButton>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </TitanCard>
            </div>
        </div>
    );
}