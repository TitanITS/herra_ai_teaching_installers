export type ApiMeta = {
    request_id?: string;
    timestamp?: string;
};

export type ApiError = {
    code: string;
    message: string;
    details?: unknown;
    _attach?: unknown;
};

export type ApiOkResponse<T> = {
    success: true;
    data: T;
    message?: string | null;
    meta?: ApiMeta;
};

export type ApiErrorResponse = {
    success: false;
    error: ApiError;
    meta?: ApiMeta;
};

export type ApiResponse<T> = ApiOkResponse<T> | ApiErrorResponse;

/** ===== Ingest Registry List ===== */

export type IngestListEntry = {
    id: number;
    created_at: string;
    text: string;
    tokens: number;
    penalized: boolean;
    detected_type?: string | null;
    recommended_format?: string | null;
    analysis_confidence?: number | null;
    trust_score?: number | null;
    trust_label?: string | null;
    ai_source?: string | null;
};

export type IngestListData = {
    entries: IngestListEntry[];
};

export type IngestTextIn = {
    text: string;
};

export type IngestTextData = {
    entry_id: number | null;
    tokens?: number | null;
};

export type PenalizeData = {
    entry_id?: number | null;
    penalized?: boolean;
    status?: string | null;
};

/** ===== Folder Scan ===== */

export type FolderScanRequest = {
    root_path?: string;
    root_paths?: string[];
    include_globs?: string[];
    exclude_globs?: string[];
    include_all_files?: boolean;
    max_files?: number;
    max_depth?: number;
};

export type FolderScanFile = {
    path: string;
    relative_path: string;
    size_bytes: number;
};

export type FolderScanResult = {
    root_path?: string;
    include_globs?: string[];
    exclude_globs?: string[];
    include_all_files?: boolean;
    count?: number;
    files_found?: number;
    files: FolderScanFile[];
};

/** ===== Files Prepare / Ingest ===== */

export type FileSourceInfo = {
    type: "file";
    path: string;
    resolved_path: string;
    size_bytes: number;
};

export type PrepareInfo = {
    recommended_format: string;
    chunk_count: number;
};

export type FilesPayload = {
    paths: string[];
    max_chars?: number;
};

export type FilesPrepareIn = FilesPayload;

export type FilesPrepareResultItem = {
    status: "ok" | "error";
    source?: FileSourceInfo;
    prepared?: PrepareInfo;
    error?: string;
};

export type FilesPrepareData = {
    status: "ok" | "partial" | "error";
    files_prepared: number;
    results: FilesPrepareResultItem[];
};

export type FilesIngestIn = FilesPayload;

export type FilesIngestResultItem = {
    status: "ok" | "error";
    source?: FileSourceInfo;
    file?: FileSourceInfo;
    prepared?: PrepareInfo;
    chunks_ingested?: number;
    entry_ids?: number[];
    error?: string;
};

export type FilesIngestData = {
    status: "ok" | "partial" | "error";
    files_ingested: number;
    chunks_ingested: number;
    results: FilesIngestResultItem[];
};