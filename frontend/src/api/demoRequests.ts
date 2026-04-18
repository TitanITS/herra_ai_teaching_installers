import { API_BASE_URL } from "./client";

export type DemoRequestPayload = {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    deployment_interest: string;
    estimated_usage: string;
    message: string;
};

export type DemoRequestResponse = {
    message: string;
    delivery_mode: string;
};

export async function submitDemoRequest(payload: DemoRequestPayload) {
    const response = await fetch(`${API_BASE_URL}/public/demo-requests`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as DemoRequestResponse | { detail?: string };

    if (!response.ok) {
        throw new Error(
            typeof data === "object" && data && "detail" in data && typeof data.detail === "string"
                ? data.detail
                : "Failed to submit demo request.",
        );
    }

    return data as DemoRequestResponse;
}