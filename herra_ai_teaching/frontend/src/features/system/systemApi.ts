import { apiGet, apiPost } from "../../lib/http/apiClient";
import { endpoints } from "../../lib/http/endpoints";
import type { ApiResponse } from "../../lib/http/types";
import type {
    AuditData,
    TrustData,
    ConfidenceData,
    AiSourceData,
    AiSourcesData,
    AiModelsData,
    AiRuntimeProfileData,
    MetaData,
    SetAiRuntimeProfileRequest,
    SetAiSourceRequest,
} from "./systemTypes";

export const systemApi = {
    meta(): Promise<ApiResponse<MetaData>> {
        return apiGet<MetaData>(endpoints.system.meta());
    },

    audit(): Promise<ApiResponse<AuditData>> {
        return apiGet<AuditData>(endpoints.system.audit());
    },

    trust(): Promise<ApiResponse<TrustData>> {
        return apiGet<TrustData>(endpoints.system.trust());
    },

    confidence(): Promise<ApiResponse<ConfidenceData>> {
        return apiGet<ConfidenceData>(endpoints.system.confidence());
    },

    aiSource(): Promise<ApiResponse<AiSourceData>> {
        return apiGet<AiSourceData>(endpoints.system.aiSource());
    },

    setAiSource(body: SetAiSourceRequest): Promise<ApiResponse<AiSourceData & { status: string }>> {
        return apiPost<AiSourceData & { status: string }>(endpoints.system.aiSource(), body);
    },

    aiSources(): Promise<ApiResponse<AiSourcesData>> {
        return apiGet<AiSourcesData>(endpoints.system.aiSources());
    },

    aiModels(): Promise<ApiResponse<AiModelsData>> {
        return apiGet<AiModelsData>(endpoints.system.aiModels());
    },

    aiRuntimeProfile(): Promise<ApiResponse<AiRuntimeProfileData>> {
        return apiGet<AiRuntimeProfileData>(endpoints.system.aiRuntimeProfile());
    },

    setAiRuntimeProfile(body: SetAiRuntimeProfileRequest): Promise<ApiResponse<AiRuntimeProfileData & { status: string }>> {
        return apiPost<AiRuntimeProfileData & { status: string }>(endpoints.system.aiRuntimeProfile(), body);
    },
};