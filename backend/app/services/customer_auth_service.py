from copy import deepcopy
from datetime import UTC, datetime
from typing import Any, Dict

from app.core.audit import build_audit_event
from app.core.exceptions import bad_request_exception, not_found_exception, unauthorized_exception
from app.core.mfa import verify_mfa_code
from app.core.security import create_signed_token, hash_password, verify_password
from app.services.role_service import get_customer_permissions_for_roles

DEV_CUSTOMER_ACCOUNT = {
    "id": 1,
    "name": "Demo Customer",
    "slug": "demo-customer",
}

DEV_CUSTOMER_USERS: Dict[str, Dict[str, Any]] = {
    "customer.admin@demo.local": {
        "id": 1,
        "email": "customer.admin@demo.local",
        "first_name": "Primary",
        "last_name": "Admin",
        "password_hash": hash_password("ChangeMe123!"),
        "is_active": True,
        "mfa_enabled": True,
        "role_names": ["Customer Administrator"],
        "customer_account_id": DEV_CUSTOMER_ACCOUNT["id"],
        "customer_account_name": DEV_CUSTOMER_ACCOUNT["name"],
    },
    "billing.manager@demo.local": {
        "id": 2,
        "email": "billing.manager@demo.local",
        "first_name": "Billing",
        "last_name": "Manager",
        "password_hash": hash_password("ChangeMe123!"),
        "is_active": True,
        "mfa_enabled": True,
        "role_names": ["Customer Billing Manager"],
        "customer_account_id": DEV_CUSTOMER_ACCOUNT["id"],
        "customer_account_name": DEV_CUSTOMER_ACCOUNT["name"],
    },
}

DEV_CUSTOMER_INVITES: Dict[str, Dict[str, Any]] = {
    "demo-customer-primary-invite": {
        "token": "demo-customer-primary-invite",
        "email": "new.customer@demo.local",
        "first_name": "New",
        "last_name": "Customer",
        "role_names": ["Customer Administrator"],
        "customer_account_id": DEV_CUSTOMER_ACCOUNT["id"],
        "customer_account_name": DEV_CUSTOMER_ACCOUNT["name"],
        "is_valid": True,
        "is_used": False,
        "expires_at": "2099-12-31T23:59:59+00:00",
    }
}


def _build_customer_user_summary(user: Dict[str, Any]) -> Dict[str, Any]:
    permissions = get_customer_permissions_for_roles(user["role_names"])
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role_names": user["role_names"],
        "permissions": permissions,
        "customer_account_id": user["customer_account_id"],
        "customer_account_name": user["customer_account_name"],
        "is_active": user["is_active"],
        "mfa_enabled": user["mfa_enabled"],
    }


def _build_customer_access_token(user_summary: Dict[str, Any]) -> str:
    return create_signed_token(
        {
            "sub": str(user_summary["id"]),
            "email": user_summary["email"],
            "identity_pool": "customer",
            "customer_account_id": user_summary["customer_account_id"],
            "role_names": user_summary["role_names"],
            "permissions": user_summary["permissions"],
        }
    )


def _get_customer_user_by_email(email: str) -> Dict[str, Any]:
    user = DEV_CUSTOMER_USERS.get(email.lower())
    if user is None:
        raise unauthorized_exception("Invalid email or password.")
    return user


def login_customer(email: str, password: str) -> Dict[str, Any]:
    user = _get_customer_user_by_email(email)

    if not user["is_active"]:
        raise unauthorized_exception("This customer user is inactive.")

    if not verify_password(password, user["password_hash"]):
        raise unauthorized_exception("Invalid email or password.")

    user_summary = _build_customer_user_summary(user)
    access_token = _build_customer_access_token(user_summary)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_summary,
        "audit_event": build_audit_event(
            actor_type="customer_user",
            action="customer_login",
            result="success",
            resource_type="customer_user",
            resource_id=str(user["id"]),
        ),
    }


def get_current_customer_user_from_token_payload(token_payload: Dict[str, Any]) -> Dict[str, Any]:
    if token_payload.get("identity_pool") != "customer":
        raise unauthorized_exception("Invalid customer authentication token.")

    email = token_payload.get("email")
    if not isinstance(email, str):
        raise unauthorized_exception("Invalid token payload.")

    user = _get_customer_user_by_email(email)
    return _build_customer_user_summary(user)


def verify_customer_mfa(email: str, mfa_code: str) -> Dict[str, str]:
    _get_customer_user_by_email(email)

    if not verify_mfa_code(mfa_code):
        raise bad_request_exception("Invalid MFA code.")

    return {"message": "Customer MFA verification succeeded."}


def forgot_customer_password(email: str) -> Dict[str, str]:
    _ = email
    return {
        "message": "If that email exists, password reset instructions will be sent in a later email-enabled phase."
    }


def reset_customer_password(reset_token: str, new_password: str) -> Dict[str, str]:
    _ = reset_token
    _ = new_password
    return {"message": "Password reset is scaffolded for a later email-enabled phase."}


def get_invite_details(token: str) -> Dict[str, Any]:
    invite = DEV_CUSTOMER_INVITES.get(token)
    if invite is None:
        raise not_found_exception("Invite token was not found.")

    if invite["is_used"]:
        raise bad_request_exception("Invite token has already been used.")

    expires_at = datetime.fromisoformat(invite["expires_at"])
    if expires_at < datetime.now(UTC):
        raise bad_request_exception("Invite token has expired.")

    return deepcopy(
        {
            "token": invite["token"],
            "email": invite["email"],
            "first_name": invite["first_name"],
            "last_name": invite["last_name"],
            "customer_account_name": invite["customer_account_name"],
            "role_names": invite["role_names"],
            "is_valid": True,
            "expires_at": invite["expires_at"],
        }
    )


def accept_invite(token: str, new_password: str, mfa_code: str) -> Dict[str, Any]:
    invite = DEV_CUSTOMER_INVITES.get(token)
    if invite is None:
        raise not_found_exception("Invite token was not found.")

    if invite["is_used"]:
        raise bad_request_exception("Invite token has already been used.")

    expires_at = datetime.fromisoformat(invite["expires_at"])
    if expires_at < datetime.now(UTC):
        raise bad_request_exception("Invite token has expired.")

    if not verify_mfa_code(mfa_code):
        raise bad_request_exception("Invalid MFA code.")

    email = invite["email"].lower()

    if email in DEV_CUSTOMER_USERS:
        user = DEV_CUSTOMER_USERS[email]
    else:
        next_id = max(user["id"] for user in DEV_CUSTOMER_USERS.values()) + 1
        user = {
            "id": next_id,
            "email": email,
            "first_name": invite["first_name"],
            "last_name": invite["last_name"],
            "password_hash": "",
            "is_active": True,
            "mfa_enabled": True,
            "role_names": invite["role_names"],
            "customer_account_id": invite["customer_account_id"],
            "customer_account_name": invite["customer_account_name"],
        }
        DEV_CUSTOMER_USERS[email] = user

    user["password_hash"] = hash_password(new_password)
    invite["is_used"] = True
    invite["is_valid"] = False

    user_summary = _build_customer_user_summary(user)
    access_token = _build_customer_access_token(user_summary)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_summary,
        "audit_event": build_audit_event(
            actor_type="customer_user",
            action="customer_invite_accept",
            result="success",
            resource_type="customer_user",
            resource_id=str(user["id"]),
        ),
    }