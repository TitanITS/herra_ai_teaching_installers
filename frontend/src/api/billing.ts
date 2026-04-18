import { apiRequest } from "./client";

export async function getCustomerBillingSummary(token: string) {
    return apiRequest<any>("/customer/billing/summary", { token });
}

export async function createCustomerBillingPortalSession(token: string) {
    return apiRequest<{ url: string }>("/customer/billing/portal", {
        method: "POST",
        token,
    });
}