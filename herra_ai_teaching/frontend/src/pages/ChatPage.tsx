import { useEffect, useMemo, useRef, useState } from "react";
import TitanButton from "../components/TitanButton";
import TitanCard from "../components/TitanCard";
import { connectorsApi } from "../features/connectors/connectorsApi";
import type { Connector } from "../features/connectors/connectorsTypes";
import { chatApi } from "../features/chat/chatApi";
import {
    getAiProfileByKey,
    getAlphabetizedAiProfiles,
    getCommonAiProfiles,
    resolveAiProfileIdentity,
    searchAiProfiles,
    type AiProfileIdentity,
} from "../features/chat/aiProfilesCatalog";
import type {
    ChatCitation,
    ChatHistoryMessage,
    ChatSendResponse,
    ChatStatusResponse,
} from "../features/chat/chatTypes";
import { systemApi } from "../features/system/systemApi";

type ChatTurn = {
    id: string;
    role: "user" | "assistant";
    content: string;
    providerUsed?: string;
    warning?: string | null;
    citations?: ChatCitation[];
    aiProfileKey?: string;
    aiProfileLabel?: string;
    providerLabel?: string;
    modelLabel?: string;
};

type ChatLoadState =
    | { status: "loading" }
    | { status: "error"; message: string; requestId?: string; partial?: ChatSuccessState }
    | ChatSuccessState;

type ChatSuccessState = {
    status: "success";
    requestId: string;
    chatStatus: ChatStatusResponse;
    connectors: Connector[];
};

type PersistedChatState = {
    turns: ChatTurn[];
    draft: string;
    useContext: boolean;
};

const CHAT_STORAGE_KEY_PREFIX = "herra_ai_chat_workspace_v2_";

function formatDateTime(value?: string | null) {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString();
}

function statusPillClass(isGood: boolean) {
    return isGood
        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
        : "border-amber-400/25 bg-amber-500/10 text-amber-100";
}

function buildHistory(turns: ChatTurn[]): ChatHistoryMessage[] {
    return turns.map((turn) => ({
        role: turn.role,
        content: turn.content,
    }));
}

function storageKeyForProfile(profileKey: string) {
    return `${CHAT_STORAGE_KEY_PREFIX}${profileKey}`;
}

function readPersistedChatState(profileKey: string): PersistedChatState {
    if (typeof window === "undefined") {
        return { turns: [], draft: "", useContext: true };
    }

    try {
        const raw = window.localStorage.getItem(storageKeyForProfile(profileKey));
        if (!raw) {
            return { turns: [], draft: "", useContext: true };
        }

        const parsed = JSON.parse(raw) as Partial<PersistedChatState>;
        const turns = Array.isArray(parsed.turns)
            ? parsed.turns.filter((turn): turn is ChatTurn => {
                return (
                    typeof turn === "object" &&
                    turn !== null &&
                    typeof turn.id === "string" &&
                    (turn.role === "user" || turn.role === "assistant") &&
                    typeof turn.content === "string"
                );
            })
            : [];

        return {
            turns,
            draft: typeof parsed.draft === "string" ? parsed.draft : "",
            useContext: typeof parsed.useContext === "boolean" ? parsed.useContext : true,
        };
    } catch {
        return { turns: [], draft: "", useContext: true };
    }
}

function writePersistedChatState(profileKey: string, state: PersistedChatState) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKeyForProfile(profileKey), JSON.stringify(state));
}

function clearPersistedChatState(profileKey: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKeyForProfile(profileKey));
}

export default function ChatPage() {
    const [state, setState] = useState<ChatLoadState>({ status: "loading" });
    const [currentProfileKey, setCurrentProfileKey] = useState<string | null>(null);
    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [useContext, setUseContext] = useState(true);
    const [composerMsg, setComposerMsg] = useState<string | null>(null);
    const [directoryOpen, setDirectoryOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedLetter, setExpandedLetter] = useState("A");
    const [pendingSwitchProfile, setPendingSwitchProfile] = useState<AiProfileIdentity | null>(null);
    const [switchingProfile, setSwitchingProfile] = useState(false);
    const conversationContainerRef = useRef<HTMLDivElement | null>(null);

    async function load() {
        setState({ status: "loading" });

        const [chatStatusRes, connectorsRes] = await Promise.all([chatApi.status(), connectorsApi.status()]);

        const partial: ChatSuccessState = {
            status: "success",
            requestId: chatStatusRes.meta?.request_id ?? connectorsRes.meta?.request_id ?? "unknown",
            chatStatus: chatStatusRes.success
                ? chatStatusRes.data
                : {
                    active_source: "unknown",
                    runtime_profile: {
                        profile_key: "default",
                        mode: "manual",
                        provider_key: null,
                        model_key: null,
                        notes: "",
                        updated_at: "",
                    },
                    api_key_present: false,
                    provider_ready: false,
                    readiness_reason: "Chat status could not be loaded.",
                    ingested_entry_count: 0,
                },
            connectors: connectorsRes.success ? connectorsRes.data.connectors ?? [] : [],
        };

        if (!chatStatusRes.success) {
            setState({
                status: "error",
                message: `${chatStatusRes.error.code}: ${chatStatusRes.error.message}`,
                requestId: chatStatusRes.meta?.request_id,
                partial,
            });
            return;
        }

        if (!connectorsRes.success) {
            setState({
                status: "error",
                message: `${connectorsRes.error.code}: ${connectorsRes.error.message}`,
                requestId: connectorsRes.meta?.request_id,
                partial,
            });
            return;
        }

        setState(partial);
    }

    useEffect(() => {
        void load();
    }, []);

    const data = state.status === "success" ? state : state.status === "error" ? state.partial ?? null : null;

    const currentProfile = useMemo(() => {
        return resolveAiProfileIdentity({
            activeSource: data?.chatStatus.active_source,
            providerKey: data?.chatStatus.runtime_profile.provider_key,
            modelKey: data?.chatStatus.runtime_profile.model_key,
        });
    }, [data?.chatStatus.active_source, data?.chatStatus.runtime_profile.model_key, data?.chatStatus.runtime_profile.provider_key]);

    useEffect(() => {
        if (!currentProfile) return;
        if (currentProfileKey === currentProfile.key) return;

        const restored = readPersistedChatState(currentProfile.key);
        setCurrentProfileKey(currentProfile.key);
        setTurns(restored.turns);
        setDraft(restored.draft);
        setUseContext(restored.useContext);
        setComposerMsg(null);
    }, [currentProfile, currentProfileKey]);

    useEffect(() => {
        if (!currentProfileKey) return;
        writePersistedChatState(currentProfileKey, { turns, draft, useContext });
    }, [currentProfileKey, turns, draft, useContext]);

    useEffect(() => {
        if (!conversationContainerRef.current) return;
        conversationContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }, [turns, currentProfileKey]);

    const connectorOnline = (data?.connectors.length ?? 0) > 0;
    const providerMode = data?.chatStatus.provider_ready ? "Ready" : "Fallback";
    const retrievalState = useContext ? "Context On" : "Context Off";

    const latestAssistantTurn = useMemo(() => {
        const reversed = [...turns].reverse();
        return reversed.find((turn) => turn.role === "assistant") ?? null;
    }, [turns]);

    const displayTurns = useMemo(() => {
        return [...turns].reverse();
    }, [turns]);

    const commonProfiles = useMemo(() => getCommonAiProfiles(currentProfile?.key), [currentProfile?.key]);
    const alphabetizedProfiles = useMemo(() => getAlphabetizedAiProfiles(currentProfile?.key), [currentProfile?.key]);
    const visibleLetters = useMemo(() => Object.keys(alphabetizedProfiles).sort(), [alphabetizedProfiles]);
    const searchResults = useMemo(() => searchAiProfiles(searchTerm, currentProfile?.key), [searchTerm, currentProfile?.key]);

    useEffect(() => {
        if (visibleLetters.length > 0 && !visibleLetters.includes(expandedLetter)) {
            setExpandedLetter(visibleLetters[0]);
        }
    }, [expandedLetter, visibleLetters]);

    function startNewChat() {
        if (!currentProfileKey) return;
        setTurns([]);
        setDraft("");
        setComposerMsg(null);
        clearPersistedChatState(currentProfileKey);
    }

    function clearDraftOnly() {
        setDraft("");
        setComposerMsg(null);
    }

    function clearChatOnly() {
        if (!currentProfileKey) return;
        setTurns([]);
        setComposerMsg(null);
        writePersistedChatState(currentProfileKey, {
            turns: [],
            draft,
            useContext,
        });
    }

    async function handleSend() {
        const payload = draft.trim();
        if (!payload || !currentProfile) {
            setComposerMsg("Please enter a question or prompt before sending.");
            return;
        }

        const history = buildHistory(turns);
        const userTurn: ChatTurn = {
            id: `user-${Date.now()}`,
            role: "user",
            content: payload,
            aiProfileKey: currentProfile.key,
            aiProfileLabel: currentProfile.label,
            providerLabel: currentProfile.providerLabel,
            modelLabel: currentProfile.modelLabel,
        };

        setTurns((current) => [...current, userTurn]);
        setDraft("");
        setSending(true);
        setComposerMsg(null);

        const response = await chatApi.sendMessage({
            message: payload,
            history,
            use_context: useContext,
        });

        if (!response.success) {
            setSending(false);
            setTurns((current) => [
                ...current,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: "assistant",
                    content: `${response.error.code}: ${response.error.message}`,
                    providerUsed: "error",
                    warning: "The connected AI request could not be completed.",
                    aiProfileKey: currentProfile.key,
                    aiProfileLabel: currentProfile.label,
                    providerLabel: currentProfile.providerLabel,
                    modelLabel: currentProfile.modelLabel,
                },
            ]);
            return;
        }

        const responseData: ChatSendResponse = response.data;
        setTurns((current) => [
            ...current,
            {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: responseData.assistant_message.content,
                providerUsed: responseData.provider_used,
                warning: responseData.warning,
                citations: responseData.citations,
                aiProfileKey: currentProfile.key,
                aiProfileLabel: currentProfile.label,
                providerLabel: currentProfile.providerLabel,
                modelLabel: currentProfile.modelLabel,
            },
        ]);
        setSending(false);
        await load();
    }

    async function confirmSwitchAi() {
        if (!pendingSwitchProfile || !currentProfileKey) return;

        writePersistedChatState(currentProfileKey, { turns, draft, useContext });
        setSwitchingProfile(true);
        setComposerMsg(null);

        try {
            const [runtimeRes, sourceRes] = await Promise.all([
                systemApi.setAiRuntimeProfile({
                    mode: "manual",
                    provider_key: pendingSwitchProfile.providerKey,
                    model_key: pendingSwitchProfile.modelKey,
                    notes: `AI Chat switched to ${pendingSwitchProfile.label}`,
                }),
                systemApi.setAiSource({
                    source_key: pendingSwitchProfile.providerKey,
                }),
            ]);

            if (!runtimeRes.success) {
                setComposerMsg(`${runtimeRes.error.code}: ${runtimeRes.error.message}`);
                setSwitchingProfile(false);
                return;
            }

            if (!sourceRes.success) {
                setComposerMsg(`${sourceRes.error.code}: ${sourceRes.error.message}`);
                setSwitchingProfile(false);
                return;
            }

            const restored = readPersistedChatState(pendingSwitchProfile.key);
            setCurrentProfileKey(pendingSwitchProfile.key);
            setTurns(restored.turns);
            setDraft(restored.draft);
            setUseContext(restored.useContext);
            setComposerMsg(
                `${pendingSwitchProfile.label} is now the active AI. Sources will reflect the same provider source on refresh.`,
            );
            setPendingSwitchProfile(null);
            setDirectoryOpen(false);
            setSwitchingProfile(false);
            await load();
        } catch {
            setComposerMsg("CLIENT_ERROR: Network error while switching the active AI.");
            setSwitchingProfile(false);
        }
    }

    function openSwitchConfirmation(profileKey: string) {
        const profile = getAiProfileByKey(profileKey);
        if (!profile || profile.key === currentProfile?.key) return;
        setPendingSwitchProfile(profile);
    }

    const activeProviderSource = data?.chatStatus.active_source ?? currentProfile.providerKey;

    return (
        <>
            <div className="space-y-5">
                <TitanCard
                    className="overflow-visible"
                    title="AI Chat"
                    subtitle="Send messages to your connected AI through Herra. Herra manages routing, provider switching, session persistence, and optional source context."
                    right={
                        <div className="flex flex-wrap gap-2">
                            <TitanButton variant="secondary" onClick={load} disabled={sending || switchingProfile}>
                                Refresh
                            </TitanButton>
                            <TitanButton
                                variant="secondary"
                                onClick={() => setDirectoryOpen(true)}
                                disabled={sending || switchingProfile}
                            >
                                Switch AI
                            </TitanButton>
                            <TitanButton
                                variant="secondary"
                                onClick={startNewChat}
                                disabled={sending || switchingProfile || (!turns.length && !draft.trim().length)}
                            >
                                New Chat
                            </TitanButton>
                        </div>
                    }
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Active AI</div>
                            <div className="mt-2 text-lg font-semibold text-white">{currentProfile.label}</div>
                            <div className="mt-2 text-xs text-slate-400">{currentProfile.providerLabel} • {currentProfile.modelLabel}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Active Provider Source</div>
                            <div className="mt-2 text-lg font-semibold text-white">{activeProviderSource}</div>
                            <div className="mt-2 text-xs text-slate-400">Switching AI here also updates the active source in the Sources tab.</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Chat Readiness</div>
                            <div className="mt-2 text-lg font-semibold text-white">{providerMode}</div>
                            <div className="mt-2 text-xs text-slate-400 break-words">{data?.chatStatus.readiness_reason ?? "Loading AI chat readiness…"}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Retrieval Context</div>
                            <div className="mt-2 text-lg font-semibold text-white">{retrievalState}</div>
                            <div className="mt-2 text-xs text-slate-400">Ingested entries available: {data?.chatStatus.ingested_entry_count ?? 0}</div>
                        </div>
                    </div>

                    {state.status === "loading" ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                            Loading AI chat workspace…
                        </div>
                    ) : null}

                    {state.status === "error" ? (
                        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                            <div className="font-semibold">AI chat load warning</div>
                            <div className="mt-1 break-words">{state.message}</div>
                            {state.requestId ? <div className="mt-2 text-xs text-slate-300">request_id: {state.requestId}</div> : null}
                            {state.partial ? <div className="mt-2 text-xs text-slate-300">Partial AI chat status is shown below where available.</div> : null}
                        </div>
                    ) : null}

                    {data ? <div className="mt-4 text-xs text-slate-400">request_id: {data.requestId}</div> : null}
                </TitanCard>

                <div className="grid gap-5 xl:grid-cols-12">
                    <TitanCard
                        className="xl:col-span-8"
                        title="Conversation"
                        subtitle="Fixed-height AI conversation workspace with an internal vertical scrollbar. Newest turns appear at the top."
                        bodyClassName="p-0"
                    >
                        <div ref={conversationContainerRef} className="h-[620px] overflow-y-auto px-5 py-4">
                            {displayTurns.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                                        <div className="text-lg font-semibold text-white">Start a conversation with your connected AI</div>
                                        <div className="mt-3 text-sm leading-6 text-slate-300">
                                            Send a message below. Herra will route the request to the selected AI, preserve the session for that AI identity, and apply optional ingested context when enabled.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayTurns.map((turn) => {
                                        const isUser = turn.role === "user";
                                        const responseLabel = turn.aiProfileLabel ?? currentProfile.label;
                                        const responseSubLabel = `${turn.providerLabel ?? currentProfile.providerLabel} • ${turn.modelLabel ?? currentProfile.modelLabel}`;

                                        return (
                                            <div
                                                key={turn.id}
                                                className={[
                                                    "rounded-2xl border p-4",
                                                    isUser
                                                        ? "ml-8 border-cyan-400/25 bg-cyan-500/10"
                                                        : "mr-8 border-white/10 bg-black/20",
                                                ].join(" ")}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-white">{isUser ? "You" : `${responseLabel} Response`}</div>
                                                        {!isUser ? <div className="mt-1 text-xs text-slate-400">{responseSubLabel}</div> : null}
                                                    </div>
                                                    {!isUser && turn.providerUsed ? (
                                                        <span
                                                            className={[
                                                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                                                statusPillClass(turn.providerUsed === "openai"),
                                                            ].join(" ")}
                                                        >
                                                            {turn.providerUsed === "openai" ? "Live AI" : turn.providerUsed === "local_fallback" ? "Dev Fallback" : turn.providerUsed}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">{turn.content}</div>

                                                {!isUser && turn.warning ? (
                                                    <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">
                                                        {turn.warning}
                                                    </div>
                                                ) : null}

                                                {!isUser && turn.citations && turn.citations.length > 0 ? (
                                                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Retrieved Context Used by Herra</div>
                                                        <div className="mt-3 space-y-2">
                                                            {turn.citations.map((citation) => (
                                                                <div key={`${turn.id}-${citation.entry_id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                                    <div className="text-xs font-semibold text-white">Entry #{citation.entry_id}</div>
                                                                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(citation.created_at)}</div>
                                                                    <div className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{citation.preview}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TitanCard>

                    <div className="xl:col-span-4 space-y-5">
                        <TitanCard
                            title="AI Session Details"
                            subtitle="Operational context for the currently selected AI identity."
                            bodyClassName="p-0"
                        >
                            <div className="h-[360px] overflow-y-auto space-y-4 px-5 py-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Selected AI Identity</div>
                                    <div className="mt-2 text-lg font-semibold text-white">{currentProfile.label}</div>
                                    <div className="mt-2 text-sm text-slate-300">{currentProfile.description}</div>
                                    <div className="mt-3 text-sm text-slate-300">Provider: <span className="font-semibold text-white">{currentProfile.providerLabel}</span></div>
                                    <div className="mt-2 text-sm text-slate-300">Model: <span className="font-semibold text-white">{currentProfile.modelLabel}</span></div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Runtime Profile</div>
                                    <div className="mt-2 text-sm text-slate-300">Mode: <span className="font-semibold text-white">{data?.chatStatus.runtime_profile.mode ?? "—"}</span></div>
                                    <div className="mt-2 text-sm text-slate-300">Provider Source: <span className="font-semibold text-white">{data?.chatStatus.runtime_profile.provider_key ?? "—"}</span></div>
                                    <div className="mt-2 text-sm text-slate-300">Model Key: <span className="font-semibold text-white">{data?.chatStatus.runtime_profile.model_key ?? "—"}</span></div>
                                    <div className="mt-2 text-xs text-slate-400">Updated: {formatDateTime(data?.chatStatus.runtime_profile.updated_at)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Provider Readiness</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusPillClass(Boolean(data?.chatStatus.provider_ready))].join(" ")}>{data?.chatStatus.provider_ready ? "Ready" : "Fallback"}</span>
                                        <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusPillClass(Boolean(data?.chatStatus.api_key_present))].join(" ")}>{data?.chatStatus.api_key_present ? "API Key Present" : "No API Key"}</span>
                                        <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusPillClass(connectorOnline)].join(" ")}>{connectorOnline ? `${data?.connectors.length ?? 0} Connector Online` : "Connector Offline"}</span>
                                    </div>
                                    <div className="mt-3 text-sm leading-6 text-slate-300 break-words">{data?.chatStatus.readiness_reason ?? "—"}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Session Persistence</div>
                                    <div className="mt-2 text-sm text-white">Saved separately for each AI identity</div>
                                    <div className="mt-2 text-xs leading-5 text-slate-400">Switching between AIs preserves each AI's own conversation history, draft text, and retrieval-context toggle in this browser.</div>
                                </div>
                            </div>
                        </TitanCard>

                        <TitanCard
                            title="Composer"
                            subtitle="Send a message to your connected AI and control whether ingested context is used."
                        >
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={`Send a message to ${currentProfile.label}...`}
                                rows={7}
                                className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                                disabled={sending || switchingProfile}
                            />

                            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={useContext}
                                    onChange={(e) => setUseContext(e.target.checked)}
                                    disabled={sending || switchingProfile}
                                    className="h-4 w-4 rounded border-white/20 bg-black/30"
                                />
                                Use ingested context when available
                            </label>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <TitanButton variant="primary" onClick={handleSend} disabled={sending || switchingProfile || !currentProfileKey}>
                                    {sending ? "Sending…" : `Send to ${currentProfile.shortLabel}`}
                                </TitanButton>
                                <TitanButton variant="secondary" onClick={clearDraftOnly} disabled={sending || switchingProfile || draft.length === 0}>
                                    Clear Draft
                                </TitanButton>
                                <TitanButton variant="secondary" onClick={clearChatOnly} disabled={sending || switchingProfile || turns.length === 0 || !currentProfileKey}>
                                    Clear Chat
                                </TitanButton>
                            </div>

                            {composerMsg ? (
                                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 break-words">
                                    {composerMsg}
                                </div>
                            ) : null}

                            {latestAssistantTurn ? (
                                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest Response Source</div>
                                    <div className="mt-2 text-sm font-semibold text-white">{latestAssistantTurn.aiProfileLabel ?? currentProfile.label} • {latestAssistantTurn.providerLabel ?? currentProfile.providerLabel}</div>
                                    <div className="mt-2 text-xs leading-5 text-slate-400">{latestAssistantTurn.modelLabel ?? currentProfile.modelLabel}</div>
                                    {latestAssistantTurn.warning ? <div className="mt-2 text-xs leading-5 text-slate-400">{latestAssistantTurn.warning}</div> : null}
                                </div>
                            ) : null}
                        </TitanCard>
                    </div>
                </div>
            </div>

            {directoryOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6">
                    <div className="w-full max-w-6xl rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                            <div>
                                <div className="text-xl font-semibold text-white">Switch AI</div>
                                <div className="mt-1 text-sm text-slate-300">Choose another AI identity. The current AI stays pinned at the top, common types are listed next, and the full directory is available by letter below.</div>
                            </div>
                            <TitanButton variant="secondary" onClick={() => setDirectoryOpen(false)} disabled={switchingProfile}>Close</TitanButton>
                        </div>

                        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Current AI</div>
                                    <div className="mt-2 text-lg font-semibold text-white">{currentProfile.label}</div>
                                    <div className="mt-2 text-sm text-slate-300">{currentProfile.providerLabel} • {currentProfile.modelLabel}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Search AI Types</div>
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by AI name, provider, or model..."
                                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                                    />
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">A–Z Directory</div>
                                    <div className="mt-3 max-h-[320px] overflow-y-auto pr-1">
                                        <div className="grid grid-cols-3 gap-2">
                                            {visibleLetters.map((letter) => (
                                                <button
                                                    key={letter}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setExpandedLetter(letter);
                                                    }}
                                                    className={[
                                                        "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                                                        expandedLetter === letter
                                                            ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100"
                                                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                                                    ].join(" ")}
                                                >
                                                    {letter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                {searchTerm.trim().length > 0 ? (
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Search Results</div>
                                        <div className="mt-3 h-[520px] overflow-y-auto space-y-3 pr-1">
                                            {searchResults.length > 0 ? searchResults.map((profile) => (
                                                <button key={profile.key} type="button" onClick={() => openSwitchConfirmation(profile.key)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10">
                                                    <div className="text-base font-semibold text-white">{profile.label}</div>
                                                    <div className="mt-1 text-sm text-slate-300">{profile.providerLabel} • {profile.modelLabel}</div>
                                                    <div className="mt-2 text-sm text-slate-400">{profile.description}</div>
                                                </button>
                                            )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No AI identities matched that search.</div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Common AI Types</div>
                                            <div className="mt-3 max-h-[210px] overflow-y-auto space-y-3 pr-1">
                                                {commonProfiles.map((profile) => (
                                                    <button key={profile.key} type="button" onClick={() => openSwitchConfirmation(profile.key)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10">
                                                        <div className="text-base font-semibold text-white">{profile.label}</div>
                                                        <div className="mt-1 text-sm text-slate-300">{profile.providerLabel} • {profile.modelLabel}</div>
                                                        <div className="mt-2 text-sm text-slate-400">{profile.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Full AI Directory</div>
                                                <div className="text-xs text-slate-400">Showing letter {expandedLetter}</div>
                                            </div>
                                            <div className="mt-3 h-[290px] overflow-y-auto space-y-3 pr-1">
                                                {(alphabetizedProfiles[expandedLetter] ?? []).map((profile) => (
                                                    <button key={profile.key} type="button" onClick={() => openSwitchConfirmation(profile.key)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10">
                                                        <div className="text-base font-semibold text-white">{profile.label}</div>
                                                        <div className="mt-1 text-sm text-slate-300">{profile.providerLabel} • {profile.modelLabel}</div>
                                                        <div className="mt-2 text-sm text-slate-400">{profile.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {pendingSwitchProfile ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                        <div className="text-xl font-semibold text-white">Switch AI?</div>
                        <div className="mt-3 text-sm leading-6 text-slate-300">
                            Switching from <span className="font-semibold text-white">{currentProfile.label}</span> to <span className="font-semibold text-white">{pendingSwitchProfile.label}</span> will also update the active source in the Sources tab and may interrupt ingestion processes currently running under the existing AI model.
                        </div>
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                            <div><span className="font-semibold text-white">Current:</span> {currentProfile.providerLabel} • {currentProfile.modelLabel}</div>
                            <div className="mt-2"><span className="font-semibold text-white">Switching to:</span> {pendingSwitchProfile.providerLabel} • {pendingSwitchProfile.modelLabel}</div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <TitanButton variant="secondary" onClick={() => setPendingSwitchProfile(null)} disabled={switchingProfile}>Cancel</TitanButton>
                            <TitanButton variant="primary" onClick={confirmSwitchAi} disabled={switchingProfile}>{switchingProfile ? "Switching…" : "Switch AI"}</TitanButton>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}