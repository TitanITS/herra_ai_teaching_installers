from fastapi import APIRouter, Depends
from backend.storage.database import fetch_trust
from backend.core.security import require_role

router = APIRouter(prefix="/trust", tags=["trust"])

@router.get("/")
def trust_view(role=Depends(require_role("admin"))):
    return {"ai_trust": fetch_trust()}
