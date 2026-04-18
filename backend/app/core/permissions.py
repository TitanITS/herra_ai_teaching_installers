from typing import Iterable, List, Set

from app.core.exceptions import forbidden_exception


def normalize_permissions(permissions: Iterable[str]) -> List[str]:
    return sorted(set(permissions))


def has_permission(permission: str, permissions: Iterable[str]) -> bool:
    permission_set: Set[str] = set(permissions)
    return permission in permission_set


def ensure_permission(permission: str, permissions: Iterable[str]) -> None:
    if not has_permission(permission, permissions):
        raise forbidden_exception(f"Missing required permission: {permission}")