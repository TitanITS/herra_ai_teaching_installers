import { apiGet } from "../../lib/http/apiClient";
import { endpoints } from "../../lib/http/endpoints";
import type { ApiResponse } from "../../lib/http/types";
import type { ConnectorsStatusResponse } from "./connectorsTypes";

export const connectorsApi = {
    status(): Promise<ApiResponse<ConnectorsStatusResponse>> {
        return apiGet<ConnectorsStatusResponse>(endpoints.connectors.status());
    },
};