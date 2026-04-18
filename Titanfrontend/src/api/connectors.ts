import { apiRequest } from "./client";
import type { PlatformConnector, PlatformConnectorDetail } from "../types/connectors";

export async function getPlatformConnectors(token: string) {
    return apiRequest<PlatformConnector[]>("/platform/connectors", { token });
}

export async function getPlatformConnectorDetail(token: string, connectorId: number) {
    return apiRequest<PlatformConnectorDetail>(`/platform/connectors/${connectorId}`, { token });
}