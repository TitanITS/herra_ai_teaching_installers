from typing import Any, Dict

from app.services.customer_account_service import DEV_CUSTOMER_ACCOUNTS, DEV_CUSTOMER_CONTACTS

DEV_CUSTOMER_SETTINGS: Dict[int, Dict[str, Any]] = {
    1: {
        "organization": {
            "company_name": "Demo Customer",
            "primary_contact_name": "Primary Admin",
            "primary_contact_email": "customer.admin@demo.local",
            "billing_contact_email": "billing@demo.local",
            "technical_contact_email": "rfoster@demo.local",
            "timezone": "America/New_York",
        },
        "notifications": {
            "billing_notices": True,
            "support_case_updates": True,
            "deployment_alerts": True,
            "connector_health_alerts": True,
        },
        "preferences": {
            "default_landing_page": "dashboard",
            "date_format": "MM/DD/YYYY",
            "time_format": "12-hour",
        },
    }
}


def _get_settings_state(customer_account_id: int) -> Dict[str, Any]:
    if customer_account_id not in DEV_CUSTOMER_SETTINGS:
        account = DEV_CUSTOMER_ACCOUNTS[customer_account_id]
        contacts = DEV_CUSTOMER_CONTACTS.get(customer_account_id, [])
        primary_contact = contacts[0] if contacts else None
        billing_contact = next((item for item in contacts if item["permission_role"] == "Billing"), None)
        technical_contact = next((item for item in contacts if item["permission_role"] == "Technical"), None)

        DEV_CUSTOMER_SETTINGS[customer_account_id] = {
            "organization": {
                "company_name": account["display_name"],
                "primary_contact_name": primary_contact["full_name"] if primary_contact else "",
                "primary_contact_email": primary_contact["email"] if primary_contact else "",
                "billing_contact_email": billing_contact["email"] if billing_contact else "",
                "technical_contact_email": technical_contact["email"] if technical_contact else "",
                "timezone": account["timezone"],
            },
            "notifications": {
                "billing_notices": True,
                "support_case_updates": True,
                "deployment_alerts": True,
                "connector_health_alerts": True,
            },
            "preferences": {
                "default_landing_page": "dashboard",
                "date_format": "MM/DD/YYYY",
                "time_format": "12-hour",
            },
        }

    return DEV_CUSTOMER_SETTINGS[customer_account_id]


def get_customer_settings(current_user: Dict[str, Any]) -> Dict[str, Any]:
    state = _get_settings_state(current_user["customer_account_id"])
    return {
        "organization": state["organization"],
        "security": {
            "mfa_enabled": current_user["mfa_enabled"],
            "last_login_at": "2026-04-04 7:42 PM Eastern",
            "active_session_label": "Current browser session",
            "password_reset_available": False,
        },
        "notifications": state["notifications"],
        "preferences": state["preferences"],
    }


def update_customer_settings_organization(
    current_user: Dict[str, Any],
    company_name: str,
    primary_contact_name: str,
    primary_contact_email: str,
    billing_contact_email: str,
    technical_contact_email: str,
    timezone: str,
) -> Dict[str, str]:
    state = _get_settings_state(current_user["customer_account_id"])
    state["organization"] = {
        "company_name": company_name.strip(),
        "primary_contact_name": primary_contact_name.strip(),
        "primary_contact_email": primary_contact_email.strip(),
        "billing_contact_email": billing_contact_email.strip(),
        "technical_contact_email": technical_contact_email.strip(),
        "timezone": timezone.strip(),
    }
    return {"message": "Organization settings updated successfully."}


def update_customer_settings_notifications(
    current_user: Dict[str, Any],
    billing_notices: bool,
    support_case_updates: bool,
    deployment_alerts: bool,
    connector_health_alerts: bool,
) -> Dict[str, str]:
    state = _get_settings_state(current_user["customer_account_id"])
    state["notifications"] = {
        "billing_notices": billing_notices,
        "support_case_updates": support_case_updates,
        "deployment_alerts": deployment_alerts,
        "connector_health_alerts": connector_health_alerts,
    }
    return {"message": "Notification settings updated successfully."}


def update_customer_settings_preferences(
    current_user: Dict[str, Any],
    default_landing_page: str,
    date_format: str,
    time_format: str,
) -> Dict[str, str]:
    state = _get_settings_state(current_user["customer_account_id"])
    state["preferences"] = {
        "default_landing_page": default_landing_page.strip(),
        "date_format": date_format.strip(),
        "time_format": time_format.strip(),
    }
    return {"message": "Portal preferences updated successfully."}