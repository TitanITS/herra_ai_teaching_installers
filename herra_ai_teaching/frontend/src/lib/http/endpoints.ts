/**
 * Centralized API endpoints.
 * This keeps frontend/backend routing consistent.
 */

export const API_BASE_URL: string =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const endpoints = {
    system: {
        meta: () => `${API_BASE_URL}/system/meta`,
        audit: () => `${API_BASE_URL}/system/audit`,
        trust: () => `${API_BASE_URL}/system/trust`,
        confidence: () => `${API_BASE_URL}/system/confidence`,
        aiSources: () => `${API_BASE_URL}/system/ai-sources`,
        aiSource: () => `${API_BASE_URL}/system/ai-source`,
        aiModels: () => `${API_BASE_URL}/system/ai-models`,
        aiRuntimeProfile: () => `${API_BASE_URL}/system/ai-runtime-profile`,
        formatAnalysis: () => `${API_BASE_URL}/system/format-analysis`,
        formatRecommendation: () => `${API_BASE_URL}/system/format-recommendation`,
        prepareIngest: () => `${API_BASE_URL}/system/prepare-ingest`,
        ingestPrepared: () => `${API_BASE_URL}/system/ingest-prepared`,
        filePrepare: () => `${API_BASE_URL}/system/file/prepare`,
        fileIngest: () => `${API_BASE_URL}/system/file/ingest`,
        filesPrepare: () => `${API_BASE_URL}/system/files/prepare`,
        filesIngest: () => `${API_BASE_URL}/system/files/ingest`,
        folderScan: () => `${API_BASE_URL}/system/folder/scan`,
    },
    ingest: {
        text: () => `${API_BASE_URL}/ingest/text`,
        list: () => `${API_BASE_URL}/ingest/list`,
        penalize: (entryId: number) => `${API_BASE_URL}/ingest/penalize/${entryId}`,
    },
    connectors: {
        status: () => `${API_BASE_URL}/connectors/status`,
        bootstrapCreate: () => `${API_BASE_URL}/connectors/bootstrap/create`,
        bootstrapList: () => `${API_BASE_URL}/connectors/bootstrap/list`,
        enroll: () => `${API_BASE_URL}/connectors/enroll`,
    },
    chat: {
        status: () => `${API_BASE_URL}/chat/status`,
        message: () => `${API_BASE_URL}/chat/message`,
    },
    jobs: {
        list: () => `${API_BASE_URL}/jobs/list`,
        get: (jobId: string) => `${API_BASE_URL}/jobs/${jobId}`,
        createAdDiscovery: () => `${API_BASE_URL}/jobs/ad-discovery/create`,
        createFolderScan: () => `${API_BASE_URL}/jobs/folder-scan/create`,
        createFilesIngest: () => `${API_BASE_URL}/jobs/files-ingest/create`,
        devMockRun: (jobId: string) => `${API_BASE_URL}/jobs/dev/mock-run/${jobId}`,
    },
} as const;