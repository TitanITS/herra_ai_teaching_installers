from typing import Any, Callable, Dict

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import unauthorized_exception
from app.core.permissions import ensure_permission
from app.core.security import decode_signed_token
from app.services.customer_auth_service import get_current_customer_user_from_token_payload
from app.services.platform_auth_service import get_current_platform_user_from_token_payload

bearer_scheme = HTTPBearer(auto_error=False)


def get_token_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None:
        raise unauthorized_exception("Authorization token is required.")

    try:
        return decode_signed_token(credentials.credentials)
    except ValueError as exc:
        raise unauthorized_exception(str(exc)) from exc


def get_current_customer_user(
    token_payload: Dict[str, Any] = Depends(get_token_payload),
) -> Dict[str, Any]:
    return get_current_customer_user_from_token_payload(token_payload)


def get_current_platform_user(
    token_payload: Dict[str, Any] = Depends(get_token_payload),
) -> Dict[str, Any]:
    return get_current_platform_user_from_token_payload(token_payload)


def require_customer_permission(permission: str) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    def dependency(
        current_user: Dict[str, Any] = Depends(get_current_customer_user),
    ) -> Dict[str, Any]:
        ensure_permission(permission, current_user["permissions"])
        return current_user

    return dependency


def require_platform_permission(permission: str) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    def dependency(
        current_user: Dict[str, Any] = Depends(get_current_platform_user),
    ) -> Dict[str, Any]:
        ensure_permission(permission, current_user["permissions"])
        return current_user

    return dependency