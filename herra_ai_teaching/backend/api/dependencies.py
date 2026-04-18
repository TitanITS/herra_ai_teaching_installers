"""
API Dependencies

Single source of truth for API key validation.
"""

from typing import Optional
from fastapi import Header, Depends
from backend.api.contracts import ApiError

DEV_API_KEY = "herra-dev-key-001"


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Required header:
    - x-api-key: herra-dev-key-001
    """
    if not x_api_key:
        raise ApiError(
            code="UNAUTHORIZED",
            message="Missing API key",
            status_code=401,
            details={"header": "x-api-key"},
        )

    if x_api_key != DEV_API_KEY:
        raise ApiError(
            code="UNAUTHORIZED",
            message="Invalid API key",
            status_code=401,
            details={"header": "x-api-key"},
        )

    return True


ApiKeyDep = Depends(verify_api_key)
