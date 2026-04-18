import { apiRequest } from "./client";

export async function getCustomerConnectors(token: string) {
    return apiRequest<any[]>("/customer/connectors", { token });
}

export async function getCustomerConnectorDetail(token: string, connectorId: number) {
    return apiRequest<any>(`/customer/connectors/${connectorId}`, { token });
}

export async function getCustomerConnectorHealth(token: string, connectorId: number) {
    return apiRequest<any>(`/customer/connectors/${connectorId}/health`, { token });
}

export async function getCustomerConnectorJobs(token: string, connectorId: number) {
    return apiRequest<any[]>(`/customer/connectors/${connectorId}/jobs`, { token });
}

export async function runCustomerConnectorAction(
    token: string,
    connectorId: number,
    actionCode: string,
) {
    return apiRequest<any>(`/customer/connectors/${connectorId}/actions/${actionCode}`, {
        method: "POST",
        token,
    });
}