import { apiRequest } from "./client";
import type { PlatformDeployment, PlatformDeploymentDetail } from "../types/deployments";

export async function getPlatformDeployments(token: string) {
    return apiRequest<PlatformDeployment[]>("/platform/deployments", { token });
}

export async function getPlatformDeploymentDetail(token: string, deploymentId: number) {
    return apiRequest<PlatformDeploymentDetail>(`/platform/deployments/${deploymentId}`, { token });
}