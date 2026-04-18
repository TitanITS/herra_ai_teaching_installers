from pydantic import BaseModel


class CustomerSettingsOrganization(BaseModel):
    company_name: str
    primary_contact_name: str
    primary_contact_email: str
    billing_contact_email: str
    technical_contact_email: str
    timezone: str


class CustomerSettingsSecurity(BaseModel):
    mfa_enabled: bool
    last_login_at: str
    active_session_label: str
    password_reset_available: bool


class CustomerSettingsNotifications(BaseModel):
    billing_notices: bool
    support_case_updates: bool
    deployment_alerts: bool
    connector_health_alerts: bool


class CustomerSettingsPreferences(BaseModel):
    default_landing_page: str
    date_format: str
    time_format: str


class CustomerSettingsResponse(BaseModel):
    organization: CustomerSettingsOrganization
    security: CustomerSettingsSecurity
    notifications: CustomerSettingsNotifications
    preferences: CustomerSettingsPreferences


class CustomerSettingsOrganizationUpdateRequest(BaseModel):
    company_name: str
    primary_contact_name: str
    primary_contact_email: str
    billing_contact_email: str
    technical_contact_email: str
    timezone: str


class CustomerSettingsNotificationsUpdateRequest(BaseModel):
    billing_notices: bool
    support_case_updates: bool
    deployment_alerts: bool
    connector_health_alerts: bool


class CustomerSettingsPreferencesUpdateRequest(BaseModel):
    default_landing_page: str
    date_format: str
    time_format: str


class CustomerSettingsMessageResponse(BaseModel):
    message: str