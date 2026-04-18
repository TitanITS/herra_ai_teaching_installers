import { apiRequest } from "./client";
import type {
    CustomerDeploymentProvisioningSummary,
    DeploymentLaunchResponse,
    ProvisioningBootstrapCreateRequest,
    ProvisioningBootstrapResponse,
} from "../types/deployments";

export async function getCustomerDeployment(token: string) {
    return apiRequest<any>("/customer/deployment", { token });
}

export async function getCustomerDeploymentHealth(token: string) {
    return apiRequest<any>("/customer/deployment/health", { token });
}

export async function getCustomerDeploymentEvents(token: string) {
    return apiRequest<any[]>("/customer/deployment/events", { token });
}

export async function launchCustomerDeployment(token: string) {
    return apiRequest<DeploymentLaunchResponse>("/customer/deployment/launch", {
        method: "POST",
        token,
    });
}

export async function getCustomerDeploymentProvisioning(token: string) {
    return apiRequest<CustomerDeploymentProvisioningSummary>("/customer/deployment/provisioning", {
        token,
    });
}

export async function createCustomerDeploymentBootstrap(
    token: string,
    payload: ProvisioningBootstrapCreateRequest,
) {
    return apiRequest<ProvisioningBootstrapResponse>("/customer/deployment/provisioning/bootstrap", {
        method: "POST",
        token,
        body: payload,
    });
}