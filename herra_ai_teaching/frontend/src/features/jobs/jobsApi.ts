import { apiGet, apiPost } from "../../lib/http/apiClient";
import { endpoints } from "../../lib/http/endpoints";
import type { ApiResponse } from "../../lib/http/types";
import type {
    AdDiscoveryCreateRequest,
    FilesIngestCreateRequest,
    FolderScanCreateRequest,
    JobResponse,
    JobsListResponse,
} from "./jobsTypes";

export const jobsApi = {
    list(limit = 50): Promise<ApiResponse<JobsListResponse>> {
        return apiGet<JobsListResponse>(`${endpoints.jobs.list()}?limit=${limit}`);
    },

    get(jobId: string): Promise<ApiResponse<JobResponse>> {
        return apiGet<JobResponse>(endpoints.jobs.get(jobId));
    },

    createAdDiscovery(body: AdDiscoveryCreateRequest): Promise<ApiResponse<JobResponse>> {
        return apiPost<JobResponse>(endpoints.jobs.createAdDiscovery(), body);
    },

    createFolderScan(body: FolderScanCreateRequest): Promise<ApiResponse<JobResponse>> {
        return apiPost<JobResponse>(endpoints.jobs.createFolderScan(), body);
    },

    createFilesIngest(body: FilesIngestCreateRequest): Promise<ApiResponse<JobResponse>> {
        return apiPost<JobResponse>(endpoints.jobs.createFilesIngest(), body);
    },

    devMockRun(jobId: string): Promise<ApiResponse<JobResponse>> {
        return apiPost<JobResponse>(endpoints.jobs.devMockRun(jobId), {});
    },
};