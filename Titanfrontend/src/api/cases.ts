import { apiRequest } from "./client";
import type {
    PlatformCaseAssignableUser,
    PlatformCaseAssignmentResponse,
    PlatformCaseCreateRequest,
    PlatformCaseDetail,
    PlatformCasePickupListItem,
    PlatformCaseWorkflowUpdateRequest,
    PlatformMyPageSummary,
} from "../types/cases";

export async function getPlatformCasesNeedingPickup(token: string) {
    return apiRequest<PlatformCasePickupListItem[]>("/platform/cases/pickup", { token });
}

export async function getPlatformCaseAssignableUsers(token: string) {
    return apiRequest<PlatformCaseAssignableUser[]>("/platform/cases/assignable-users", { token });
}

export async function getPlatformMyPageSummary(token: string) {
    return apiRequest<PlatformMyPageSummary>("/platform/cases/my-page", { token });
}

export async function getPlatformCaseDetail(token: string, caseId: number) {
    return apiRequest<PlatformCaseDetail>(`/platform/cases/${caseId}`, { token });
}

export async function createPlatformCase(token: string, payload: PlatformCaseCreateRequest) {
    return apiRequest<PlatformCaseDetail>("/platform/cases", {
        method: "POST",
        token,
        body: payload,
    });
}

export async function acceptPlatformCase(token: string, caseId: number) {
    return apiRequest<PlatformCaseAssignmentResponse>(`/platform/cases/${caseId}/accept`, {
        method: "POST",
        token,
    });
}

export async function assignPlatformCase(token: string, caseId: number, assignedToName: string) {
    return apiRequest<PlatformCaseAssignmentResponse>(`/platform/cases/${caseId}/assign`, {
        method: "POST",
        token,
        body: {
            assigned_to_name: assignedToName,
        },
    });
}

export async function updatePlatformCaseWorkflow(
    token: string,
    caseId: number,
    payload: PlatformCaseWorkflowUpdateRequest,
) {
    return apiRequest<PlatformCaseDetail>(`/platform/cases/${caseId}/workflow`, {
        method: "POST",
        token,
        body: payload,
    });
}