import { apiRequest } from "./client";

export async function getCustomerAccount(token: string) {
    return apiRequest<any>("/customer/account", { token });
}

export async function getDashboardSummary(token: string) {
    return apiRequest<any>("/customer/dashboard-summary", { token });
}

export async function getAccountManager(token: string) {
    return apiRequest<any>("/customer/account-manager", { token });
}