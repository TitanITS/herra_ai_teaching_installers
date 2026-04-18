import { apiGet, apiPost } from "../../lib/http/apiClient";
import { endpoints } from "../../lib/http/endpoints";
import type { ApiResponse } from "../../lib/http/types";

import type {
    IngestListData,
    IngestTextData,
    IngestTextIn,
    PenalizeData,
    FolderScanRequest,
    FolderScanResult,
    FilesPayload,
    FilesPrepareData,
    FilesIngestData,
} from "./ingestTypes";

/**
 * ingestApi is the single place the UI calls backend endpoints.
 * We are keeping the existing manual ingest methods and the legacy local
 * auto-detect helpers for older pages that may still reference them.
 */
export const ingestApi = {
    list(): Promise<ApiResponse<IngestListData>> {
        return apiGet<IngestListData>(endpoints.ingest.list());
    },

    ingestText(payload: IngestTextIn): Promise<ApiResponse<IngestTextData>> {
        return apiPost<IngestTextData>(endpoints.ingest.text(), payload);
    },

    penalize(entryId: number): Promise<ApiResponse<PenalizeData>> {
        return apiPost<PenalizeData>(endpoints.ingest.penalize(entryId), {});
    },

    folderScan(payload: FolderScanRequest): Promise<ApiResponse<FolderScanResult>> {
        return apiPost<FolderScanResult>(endpoints.system.folderScan(), payload);
    },

    filesPrepare(payload: FilesPayload): Promise<ApiResponse<FilesPrepareData>> {
        return apiPost<FilesPrepareData>(endpoints.system.filesPrepare(), payload);
    },

    filesIngest(payload: FilesPayload): Promise<ApiResponse<FilesIngestData>> {
        return apiPost<FilesIngestData>(endpoints.system.filesIngest(), payload);
    },
};