import { apiGet, apiPost } from "../../lib/http/apiClient";
import { endpoints } from "../../lib/http/endpoints";
import type { ApiResponse } from "../../lib/http/types";
import type { ChatStatusResponse, ChatSendResponse, SendChatMessageRequest } from "./chatTypes";

export const chatApi = {
    status(): Promise<ApiResponse<ChatStatusResponse>> {
        return apiGet<ChatStatusResponse>(endpoints.chat.status());
    },

    sendMessage(body: SendChatMessageRequest): Promise<ApiResponse<ChatSendResponse>> {
        return apiPost<ChatSendResponse>(endpoints.chat.message(), body);
    },
};