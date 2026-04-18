import { apiRequest } from "./client";
import type {
    PlatformCustomerCreateInput,
    PlatformCustomerDetail,
    PlatformCustomerListItem,
} from "../types/customers";

export async function getPlatformCustomers(token: string) {
    return apiRequest<PlatformCustomerListItem[]>("/platform/customers", { token });
}

export async function getPlatformCustomerDetail(token: string, customerId: number) {
    return apiRequest<PlatformCustomerDetail>(`/platform/customers/${customerId}`, { token });
}

export async function createPlatformCustomer(token: string, payload: PlatformCustomerCreateInput) {
    return apiRequest<PlatformCustomerDetail>("/platform/customers", {
        method: "POST",
        token,
        body: payload,
    });
}