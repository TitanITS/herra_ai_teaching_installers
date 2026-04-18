import { apiRequest } from "./client";
import type {
    SupportCase,
    SupportCaseCreateRequest,
    SupportCaseCreateResponse,
    SupportCaseReplyRequest,
    SupportCaseReplyResponse,
    SupportResources,
} from "../types/support";

export async function getCustomerSupportCases(token: string) {
    return apiRequest<SupportCase[]>("/customer/support/cases", { token });
}

export async function createCustomerSupportCase(token: string, input: SupportCaseCreateRequest) {
    return apiRequest<SupportCaseCreateResponse>("/customer/support/cases", {
        method: "POST",
        token,
        body: input,
    });
}

export async function getCustomerSupportResources(token: string) {
    return apiRequest<SupportResources>("/customer/support/resources", { token });
}

export async function addCustomerSupportCaseReply(token: string, caseId: number, input: SupportCaseReplyRequest) {
    return apiRequest<SupportCaseReplyResponse>(`/customer/support/cases/${caseId}/reply`, {
        method: "POST",
        token,
        body: input,
    });
}