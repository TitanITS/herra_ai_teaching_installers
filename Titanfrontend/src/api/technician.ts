import { apiRequest } from "./client";
import type {
    TechnicianWorkspaceCustomerListItem,
    TechnicianWorkspaceDetail,
} from "../types/technician";

export async function getTechnicianWorkspaceCustomers(token: string) {
    return apiRequest<TechnicianWorkspaceCustomerListItem[]>("/platform/technician/customers", { token });
}

export async function getTechnicianWorkspaceDetail(token: string, customerId: number) {
    return apiRequest<TechnicianWorkspaceDetail>(`/platform/technician/customers/${customerId}`, { token });
}