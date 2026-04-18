export interface ChatCitation {
    entry_id: number;
    created_at: string | null;
    preview: string;
}

export interface ChatAssistantMessage {
    role: "assistant";
    content: string;
}

export interface ChatSendResponse {
    assistant_message: ChatAssistantMessage;
    active_source: string;
    provider_used: string;
    warning: string | null;
    citations: ChatCitation[];
    ingested_context_count: number;
}

export interface ChatRuntimeProfile {
    profile_key: string;
    mode: string;
    provider_key: string | null;
    model_key: string | null;
    notes: string;
    updated_at: string;
}

export interface ChatStatusResponse {
    active_source: string;
    runtime_profile: ChatRuntimeProfile;
    api_key_present: boolean;
    provider_ready: boolean;
    readiness_reason: string;
    ingested_entry_count: number;
}

export interface ChatHistoryMessage {
    role: "user" | "assistant";
    content: string;
}

export interface SendChatMessageRequest {
    message: string;
    history: ChatHistoryMessage[];
    use_context: boolean;
}