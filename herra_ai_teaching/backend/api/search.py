from fastapi import APIRouter
from backend.storage.database import list_text


router = APIRouter()




@router.get("/")
def search():
    return {"results": list_text()}