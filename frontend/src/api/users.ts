import { apiRequest } from "./client";

export async function getCustomerUsers(token: string) {
    return apiRequest<any[]>("/customer/users", { token });
}

export async function createCustomerUser(
    token: string,
    input: {
        email: string;
        first_name: string;
        last_name: string;
        role_names: string[];
    },
) {
    return apiRequest<any>("/customer/users", {
        method: "POST",
        token,
        body: input,
    });
}

export async function getCustomerUserDetail(token: string, userId: number) {
    return apiRequest<any>(`/customer/users/${userId}`, { token });
}

export async function disableCustomerUser(token: string, userId: number) {
    return apiRequest<any>(`/customer/users/${userId}/disable`, {
        method: "POST",
        token,
    });
}

export async function enableCustomerUser(token: string, userId: number) {
    return apiRequest<any>(`/customer/users/${userId}/enable`, {
        method: "POST",
        token,
    });
}

export async function resendCustomerUserInvite(token: string, userId: number) {
    return apiRequest<any>(`/customer/users/${userId}/invites/resend`, {
        method: "POST",
        token,
    });
}

export async function assignCustomerUserRoles(
    token: string,
    userId: number,
    roleNames: string[],
) {
    return apiRequest<any>(`/customer/users/${userId}/roles`, {
        method: "POST",
        token,
        body: { role_names: roleNames },
    });
}