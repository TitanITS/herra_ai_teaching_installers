import type { ApiResponse, ApiErrorResponse } from "./types"

const API_KEY: string | undefined = (import.meta as any).env?.VITE_API_KEY

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiRequestOptions {
    method?: HttpMethod
    headers?: Record<string, string>
    body?: unknown
    signal?: AbortSignal
}

/**
 * Convert unexpected failures (network down, CORS, non-JSON, etc.)
 * into an S5-shaped error response so the UI is always consistent.
 */
function toClientError(message: string, details?: Record<string, unknown>): ApiErrorResponse {
    return {
        success: false,
        error: {
            code: "CLIENT_ERROR",
            message,
            details: details ?? {},
        },
        meta: {
            request_id: "client",
            timestamp: new Date().toISOString(),
        },
    }
}

/**
 * The one true HTTP client for the frontend.
 * Always returns ApiResponse<T> (never throws for normal failures).
 */
export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const method = options.method ?? "GET"

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(options.headers ?? {}),
    }

    // Only set Content-Type if we actually send a JSON body
    const hasBody = options.body !== undefined
    if (hasBody) {
        headers["Content-Type"] = "application/json"
    }

    // Add API key if present (dev)
    if (API_KEY && API_KEY.trim().length > 0) {
        headers["x-api-key"] = API_KEY.trim()
    }

    let response: Response
    try {
        response = await fetch(url, {
            method,
            headers,
            body: hasBody ? JSON.stringify(options.body) : undefined,
            signal: options.signal,
        })
    } catch (err) {
        return toClientError("Network error (request failed)", {
            url,
            method,
            error: err instanceof Error ? err.message : String(err),
        })
    }

    // Try to parse JSON; if it isn't JSON, return a client error
    let json: unknown
    try {
        json = await response.json()
    } catch (err) {
        return toClientError("Server returned a non-JSON response", {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            error: err instanceof Error ? err.message : String(err),
        })
    }

    // If backend is S5-compliant, it should already be ApiResponse<T>.
    // If not, we wrap it into an error so the UI can handle it consistently.
    if (typeof json === "object" && json !== null && "success" in (json as any)) {
        return json as ApiResponse<T>
    }

    return toClientError("Unexpected response shape (not S5 envelope)", {
        url,
        method,
        status: response.status,
        raw: json as any,
    })
}

/** Convenience helpers */
export function apiGet<T>(url: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(url, { ...options, method: "GET" })
}

export function apiPost<T>(url: string, body: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(url, { ...options, method: "POST", body })
}
