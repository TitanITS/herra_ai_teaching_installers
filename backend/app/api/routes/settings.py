from fastapi import APIRouter, Depends

from app.api.deps import get_current_customer_user
from app.schemas.settings import (
    CustomerSettingsMessageResponse,
    CustomerSettingsNotificationsUpdateRequest,
    CustomerSettingsOrganizationUpdateRequest,
    CustomerSettingsPreferencesUpdateRequest,
    CustomerSettingsResponse,
)
from app.services.settings_service import (
    get_customer_settings,
    update_customer_settings_notifications,
    update_customer_settings_organization,
    update_customer_settings_preferences,
)

router = APIRouter(prefix="/customer/settings", tags=["Customer Settings"])


@router.get("", response_model=CustomerSettingsResponse)
def customer_settings(
    current_user: dict = Depends(get_current_customer_user),
):
    return get_customer_settings(current_user)


@router.post("/organization", response_model=CustomerSettingsMessageResponse)
def customer_settings_organization_update(
    payload: CustomerSettingsOrganizationUpdateRequest,
    current_user: dict = Depends(get_current_customer_user),
):
    return update_customer_settings_organization(
        current_user=current_user,
        company_name=payload.company_name,
        primary_contact_name=payload.primary_contact_name,
        primary_contact_email=payload.primary_contact_email,
        billing_contact_email=payload.billing_contact_email,
        technical_contact_email=payload.technical_contact_email,
        timezone=payload.timezone,
    )


@router.post("/notifications", response_model=CustomerSettingsMessageResponse)
def customer_settings_notifications_update(
    payload: CustomerSettingsNotificationsUpdateRequest,
    current_user: dict = Depends(get_current_customer_user),
):
    return update_customer_settings_notifications(
        current_user=current_user,
        billing_notices=payload.billing_notices,
        support_case_updates=payload.support_case_updates,
        deployment_alerts=payload.deployment_alerts,
        connector_health_alerts=payload.connector_health_alerts,
    )


@router.post("/preferences", response_model=CustomerSettingsMessageResponse)
def customer_settings_preferences_update(
    payload: CustomerSettingsPreferencesUpdateRequest,
    current_user: dict = Depends(get_current_customer_user),
):
    return update_customer_settings_preferences(
        current_user=current_user,
        default_landing_page=payload.default_landing_page,
        date_format=payload.date_format,
        time_format=payload.time_format,
    )