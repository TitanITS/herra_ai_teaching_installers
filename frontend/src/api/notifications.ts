import { apiRequest } from "./client";

export async function getNotifications(token: string) {
    return apiRequest<any[]>("/customer/notifications", { token });
}