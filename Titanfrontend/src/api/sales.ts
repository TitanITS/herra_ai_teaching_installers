import { apiRequest } from "./client";
import type {
    PlatformSalesCreateOpportunityInput,
    PlatformSalesOpportunityDetail,
    PlatformSalesOpportunityListItem,
} from "../types/sales";

export async function getPlatformSalesOpportunities(token: string) {
    return apiRequest<PlatformSalesOpportunityListItem[]>("/platform/sales", { token });
}

export async function getPlatformSalesOpportunityDetail(token: string, opportunityId: number) {
    return apiRequest<PlatformSalesOpportunityDetail>(`/platform/sales/${opportunityId}`, { token });
}

export async function createPlatformSalesOpportunity(token: string, payload: PlatformSalesCreateOpportunityInput) {
    return apiRequest<PlatformSalesOpportunityDetail>("/platform/sales", {
        method: "POST",
        token,
        body: payload,
    });
}

export async function createPlatformRenewalOpportunity(token: string, customerId: number) {
    return apiRequest<PlatformSalesOpportunityDetail>(`/platform/sales/renewals/${customerId}`, {
        method: "POST",
        token,
    });
}
