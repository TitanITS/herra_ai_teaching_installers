from fastapi import Header, HTTPException
from backend.core.config import API_KEYS

def require_role(required_role: str):
    def checker(x_api_key: str = Header(None)):
        if x_api_key not in API_KEYS:
            raise HTTPException(status_code=401, detail="Invalid API key")

        role = API_KEYS[x_api_key]
        order = ["user", "admin", "system"]

        if order.index(role) < order.index(required_role):
            raise HTTPException(status_code=403, detail="Insufficient privileges")

        return role
    return checker
