from fastapi import Header, HTTPException, Depends
from backend.security.roles import Role

# -------------------------------------------------
# API keys (move to env vars later)
# -------------------------------------------------
API_KEYS = {
    "admin-key-123": Role.admin,
    "user-key-456": Role.user,
}


def get_current_role(x_api_key: str = Header(...)) -> Role:
    if x_api_key not in API_KEYS:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key"
        )
    return API_KEYS[x_api_key]


def require_role(required: Role):
    def checker(role: Role = Depends(get_current_role)):
        if role != required:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return role
    return checker
