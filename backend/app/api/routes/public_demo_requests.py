from fastapi import APIRouter

from app.schemas.public_demo_requests import (
    PublicDemoRequestCreateRequest,
    PublicDemoRequestCreateResponse,
)
from app.services.public_demo_request_service import create_public_demo_request

router = APIRouter(prefix="/public/demo-requests", tags=["Public Demo Requests"])


@router.post("", response_model=PublicDemoRequestCreateResponse)
def public_demo_request_create(payload: PublicDemoRequestCreateRequest):
    return create_public_demo_request(payload)