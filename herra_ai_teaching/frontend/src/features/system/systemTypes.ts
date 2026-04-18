export interface AuditEntry {
    id: number;
    action: string;
    reference_id: number | null;
    created_at: string;
}

export interface AuditData {
    entries: AuditEntry[];
}

export interface TrustData {
    total?: number | null;
    trusted?: number | null;
    penalized?: number | null;
    average_trust_score?: number | null;
    trust_level?: string | null;
    status?: string | null;
    reason?: string | null;
}

export interface ConfidenceData {
    average_tokens?: number | null;
    confidence?: string | null;
    confidence_score?: number | null;
    analyzed_entries?: number | null;
    status?: string | null;
    reason?: string | null;
}

export interface AiSourceData {
    active_source: string;
}

export interface AiSourceItem {
    key: string;
    label: string;
}

export interface AiSourcesData {
    sources: AiSourceItem[];
}

export interface SetAiSourceRequest {
    source_key: string;
}

export interface AiModelItem {
    model_key: string;
    model_label: string;
}

export interface AiProviderItem {
    provider_key: string;
    provider_label: string;
    models: AiModelItem[];
}

export interface AiModelsData {
    providers: AiProviderItem[];
}

export type AiRuntimeMode = "manual" | "autodetect";

export interface AiRuntimeProfile {
    profile_key: string;
    mode: AiRuntimeMode;
    provider_key: string | null;
    model_key: string | null;
    notes: string;
    updated_at: string;
}

export interface AiRuntimeProfileData {
    profile: AiRuntimeProfile;
}

export interface SetAiRuntimeProfileRequest {
    mode: AiRuntimeMode;
    provider_key?: string | null;
    model_key?: string | null;
    notes?: string;
}

export interface MetaData {
    app_name: string;
    app_version: string;
    env: string;
    features: {
        docs?: boolean;
        health?: boolean;
        connector_jobs?: boolean;
        ai_runtime_profile?: boolean;
    };
    cors_allow_origins: string[];
    scan_roots?: string[];
}