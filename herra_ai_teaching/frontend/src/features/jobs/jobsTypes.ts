export type JobType = "ad_discovery" | "folder_scan" | "files_ingest";
export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type Job = {
    job_id: string;
    job_type: JobType;
    status: JobStatus;
    created_at: string;
    updated_at: string;
    requested_by?: string | null;
    input: Record<string, any>;
    logs: string[];
    result?: Record<string, any> | null;
    error?: string | null;
};

export type JobsListResponse = {
    jobs: Job[];
};

export type JobResponse = {
    job: Job;
};

export type AdDiscoveryCreateRequest = {
    domain_hint?: string;
    server_only?: boolean;
};

export type FolderScanCreateRequest = {
    root_paths: string[];
    include_globs?: string[];
    exclude_globs?: string[];
    max_files?: number;
    max_depth?: number;
};

export type FilesIngestCreateRequest = {
    paths: string[];
    max_chars?: number;
};