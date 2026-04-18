import { apiRequest } from "./client";

export async function getCustomerSettings(token: string) {
    return apiRequest<any>("/customer/settings", { token });
}

export async function updateCustomerSettingsOrganization(
    token: string,
    input: {
        company_name: string;
        primary_contact_name: string;
        primary_contact_email: string;
        billing_contact_email: string;
        technical_contact_email: string;
        timezone: string;
    },
) {
    return apiRequest<{ message: string }>("/customer/settings/organization", {
        method: "POST",
        token,
        body: input,
    });
}

export async function updateCustomerSettingsNotifications(
    token: string,
    input: {
        billing_notices: boolean;
        support_case_updates: boolean;
        deployment_alerts: boolean;
        connector_health_alerts: boolean;
    },
) {
    return apiRequest<{ message: string }>("/customer/settings/notifications", {
        method: "POST",
        token,
        body: input,
    });
}

export async function updateCustomerSettingsPreferences(
    token: string,
    input: {
        default_landing_page: string;
        date_format: string;
        time_format: string;
    },
) {
    return apiRequest<{ message: string }>("/customer/settings/preferences", {
        method: "POST",
        token,
        body: input,
    });
}