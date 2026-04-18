import { apiRequest } from "./client";

export async function getCustomerRoles(token: string) {
    return apiRequest<any[]>("/customer/roles", { token });
}

export async function getCustomerPermissions(token: string) {
    return apiRequest<any[]>("/customer/permissions", { token });
}