import { apiRequest } from "./client";

export async function loginCustomer(input: { email: string; password: string }) {
    return apiRequest<any>("/customer-auth/login", {
        method: "POST",
        body: input,
    });
}

export async function getCurrentCustomerUser(token: string) {
    return apiRequest<any>("/customer-auth/me", { token });
}

export function logoutCustomer() {
    return;
}