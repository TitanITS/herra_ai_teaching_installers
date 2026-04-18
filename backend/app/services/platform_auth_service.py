from typing import Any, Dict

from app.core.audit import build_audit_event
from app.core.exceptions import bad_request_exception, unauthorized_exception
from app.core.mfa import verify_mfa_code
from app.core.security import create_signed_token, hash_password, verify_password
from app.services.role_service import get_platform_permissions_for_roles

DEV_PLATFORM_USERS: Dict[str, Dict[str, Any]] = {
    "platform.admin@titan.local": {
        "id": 1,
        "email": "platform.admin@titan.local",
        "first_name": "Platform",
        "last_name": "Admin",
        "password_hash": hash_password("ChangeMe123!"),
        "is_active": True,
        "mfa_enabled": True,
        "role_names": ["Titan Super Admin"],
    },
    "support.admin@titan.local": {
        "id": 2,
        "email": "support.admin@titan.local",
        "first_name": "Support",
        "last_name": "Admin",
        "password_hash": hash_password("ChangeMe123!"),
        "is_active": True,
        "mfa_enabled": True,
        "role_names": ["Titan Support Admin"],
    },
    "technician@titan.local": {
        "id": 3,
        "email": "technician@titan.local",
        "first_name": "Titan",
        "last_name": "Technician",
        "password_hash": hash_password("ChangeMe123!"),
        "is_active": True,
        "mfa_enabled": True,
        "role_names": ["Titan Technician"],
    },
}


def _build_platform_user_summary(user: Dict[str, Any]) -> Dict[str, Any]:
    permissions = get_platform_permissions_for_roles(user["role_names"])
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role_names": user["role_names"],
        "permissions": permissions,
        "is_active": user["is_active"],
        "mfa_enabled": user["mfa_enabled"],
    }


def _build_platform_access_token(user_summary: Dict[str, Any]) -> str:
    return create_signed_token(
        {
            "sub": str(user_summary["id"]),
            "email": user_summary["email"],
            "identity_pool": "platform",
            "role_names": user_summary["role_names"],
            "permissions": user_summary["permissions"],
        }
    )


def _get_platform_user_by_email(email: str) -> Dict[str, Any]:
    user = DEV_PLATFORM_USERS.get(email.lower())
    if user is None:
        raise unauthorized_exception("Invalid email or password.")
    return user


def login_platform_user(email: str, password: str) -> Dict[str, Any]:
    user = _get_platform_user_by_email(email)

    if not user["is_active"]:
        raise unauthorized_exception("This Titan user is inactive.")

    if not verify_password(password, user["password_hash"]):
        raise unauthorized_exception("Invalid email or password.")

    user_summary = _build_platform_user_summary(user)
    access_token = _build_platform_access_token(user_summary)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_summary,
        "audit_event": build_audit_event(
            actor_type="platform_user",
            action="platform_login",
            result="success",
            resource_type="platform_user",
            resource_id=str(user["id"]),
        ),
    }


def get_current_platform_user_from_token_payload(token_payload: Dict[str, Any]) -> Dict[str, Any]:
    if token_payload.get("identity_pool") != "platform":
        raise unauthorized_exception("Invalid Titan authentication token.")

    email = token_payload.get("email")
    if not isinstance(email, str):
        raise unauthorized_exception("Invalid token payload.")

    user = _get_platform_user_by_email(email)
    return _build_platform_user_summary(user)


def verify_platform_mfa(email: str, mfa_code: str) -> Dict[str, str]:
    _get_platform_user_by_email(email)

    if not verify_mfa_code(mfa_code):
        raise bad_request_exception("Invalid MFA code.")

    return {"message": "Titan MFA verification succeeded."}


def forgot_platform_password(email: str) -> Dict[str, str]:
    _ = email
    return {
        "message": "If that email exists, password reset instructions will be sent in a later email-enabled phase."
    }


def reset_platform_password(reset_token: str, new_password: str) -> Dict[str, str]:
    _ = reset_token
    _ = new_password
    return {"message": "Password reset is scaffolded for a later email-enabled phase."}