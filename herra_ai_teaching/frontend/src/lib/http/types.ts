/**
 * S5 API Envelope Types
 *
 * These types mirror the backend S5 contract exactly.
 * Every API call in the frontend MUST use these.
 */

/**
 * Metadata returned with every response.
 */
export interface ApiMeta {
    request_id: string
    timestamp: string
}

/**
 * Error payload returned when success === false.
 */
export interface ApiError {
    code: string
    message: string
    details: Record<string, unknown>
}

/**
 * Success envelope.
 */
export interface ApiSuccessResponse<T> {
    success: true
    data: T
    message: string | null
    meta: ApiMeta
}

/**
 * Error envelope.
 */
export interface ApiErrorResponse {
    success: false
    error: ApiError
    meta: ApiMeta
}

/**
 * Unified API response type.
 */
export type ApiResponse<T> =
    | ApiSuccessResponse<T>
    | ApiErrorResponse
