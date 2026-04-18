const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";

const viteEnv = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
}).env;

export const API_BASE_URL = viteEnv?.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

type RequestOptions = {
    method?: string;
    token?: string;
    body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let message = "Request failed.";

        try {
            const errorBody = await response.json();
            message = errorBody.detail ?? JSON.stringify(errorBody);
        } catch {
            message = response.statusText || message;
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}