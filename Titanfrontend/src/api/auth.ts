import { apiRequest } from "./client";
import type { PlatformLoginInput, PlatformLoginResponse, TitanPlatformUser } from "../types/auth";

export async function loginPlatform(input: PlatformLoginInput) {
    return apiRequest<PlatformLoginResponse>("/platform-auth/login", {
        method: "POST",
        body: input,
    });
}

export async function getCurrentPlatformUser(token: string) {
    return apiRequest<TitanPlatformUser>("/platform-auth/me", { token });
}

export function logoutPlatform() {
    return;
}