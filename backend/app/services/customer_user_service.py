from typing import Any, Dict, List

from app.core.exceptions import bad_request_exception, not_found_exception
from app.services.customer_auth_service import DEV_CUSTOMER_INVITES, DEV_CUSTOMER_USERS
from app.services.role_service import (
    get_customer_permissions_for_roles,
    validate_customer_role_names,
)


def _build_customer_user_summary(user: Dict[str, Any]) -> Dict[str, Any]:
    permissions = get_customer_permissions_for_roles(user["role_names"])
    invite_pending = any(
        invite["email"].lower() == user["email"].lower() and not invite["is_used"]
        for invite in DEV_CUSTOMER_INVITES.values()
    )

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
        "invite_pending": invite_pending,
    }


def _find_user_by_id(user_id: int) -> Dict[str, Any]:
    for user in DEV_CUSTOMER_USERS.values():
        if user["id"] == user_id:
            return user
    raise not_found_exception("Customer user was not found.")


def _build_invite_token(email: str) -> str:
    safe_email = email.lower().replace("@", "-at-").replace(".", "-")
    return f"invite-{safe_email}"


def list_customer_users(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    users = [
        _build_customer_user_summary(user)
        for user in DEV_CUSTOMER_USERS.values()
        if user["customer_account_id"] == current_user["customer_account_id"]
    ]
    return sorted(users, key=lambda item: item["id"])


def get_customer_user_detail(current_user: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")
    return _build_customer_user_summary(user)


def create_customer_user_invite(
    current_user: Dict[str, Any],
    email: str,
    first_name: str,
    last_name: str,
    role_names: List[str],
) -> Dict[str, Any]:
    try:
        validate_customer_role_names(role_names)
    except ValueError as exc:
        raise bad_request_exception(str(exc)) from exc

    email = email.lower().strip()

    if email in DEV_CUSTOMER_USERS:
        raise bad_request_exception("A customer user with that email already exists.")

    for invite in DEV_CUSTOMER_INVITES.values():
        if invite["email"].lower() == email and not invite["is_used"]:
            raise bad_request_exception("An active invite already exists for that email.")

    next_id = max(user["id"] for user in DEV_CUSTOMER_USERS.values()) + 1
    user = {
        "id": next_id,
        "email": email,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "password_hash": "",
        "is_active": True,
        "mfa_enabled": False,
        "role_names": role_names,
        "customer_account_id": current_user["customer_account_id"],
        "customer_account_name": current_user["customer_account_name"],
    }
    DEV_CUSTOMER_USERS[email] = user

    invite_token = _build_invite_token(email)
    DEV_CUSTOMER_INVITES[invite_token] = {
        "token": invite_token,
        "email": email,
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role_names": role_names,
        "customer_account_id": user["customer_account_id"],
        "customer_account_name": user["customer_account_name"],
        "is_valid": True,
        "is_used": False,
        "expires_at": "2099-12-31T23:59:59+00:00",
    }

    return {
        "message": "Customer user invite created successfully.",
        "invite_token": invite_token,
        "user": _build_customer_user_summary(user),
    }


def update_customer_user(
    current_user: Dict[str, Any],
    user_id: int,
    first_name: str | None,
    last_name: str | None,
) -> Dict[str, Any]:
    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")

    if first_name is not None:
        user["first_name"] = first_name.strip()

    if last_name is not None:
        user["last_name"] = last_name.strip()

    return _build_customer_user_summary(user)


def disable_customer_user(current_user: Dict[str, Any], user_id: int) -> Dict[str, str]:
    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")

    user["is_active"] = False
    return {"message": "Customer user disabled successfully."}


def enable_customer_user(current_user: Dict[str, Any], user_id: int) -> Dict[str, str]:
    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")

    user["is_active"] = True
    return {"message": "Customer user enabled successfully."}


def assign_roles_to_customer_user(
    current_user: Dict[str, Any],
    user_id: int,
    role_names: List[str],
) -> Dict[str, Any]:
    try:
        validate_customer_role_names(role_names)
    except ValueError as exc:
        raise bad_request_exception(str(exc)) from exc

    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")

    user["role_names"] = role_names

    for invite in DEV_CUSTOMER_INVITES.values():
        if invite["email"].lower() == user["email"].lower() and not invite["is_used"]:
            invite["role_names"] = role_names

    return _build_customer_user_summary(user)


def resend_customer_user_invite(current_user: Dict[str, Any], user_id: int) -> Dict[str, str]:
    user = _find_user_by_id(user_id)
    if user["customer_account_id"] != current_user["customer_account_id"]:
        raise not_found_exception("Customer user was not found.")

    for invite in DEV_CUSTOMER_INVITES.values():
        if invite["email"].lower() == user["email"].lower() and not invite["is_used"]:
            return {"message": "Customer user invite resent successfully."}

    invite_token = _build_invite_token(user["email"])
    DEV_CUSTOMER_INVITES[invite_token] = {
        "token": invite_token,
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role_names": user["role_names"],
        "customer_account_id": user["customer_account_id"],
        "customer_account_name": user["customer_account_name"],
        "is_valid": True,
        "is_used": False,
        "expires_at": "2099-12-31T23:59:59+00:00",
    }

    return {"message": "Customer user invite resent successfully."}