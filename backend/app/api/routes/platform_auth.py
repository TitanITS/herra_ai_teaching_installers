from fastapi import APIRouter, Depends

from app.api.deps import get_current_platform_user
from app.schemas.platform_auth import (
    PlatformForgotPasswordRequest,
    PlatformLoginRequest,
    PlatformLoginResponse,
    PlatformMessageResponse,
    PlatformMfaVerifyRequest,
    PlatformResetPasswordRequest,
    PlatformUserSummary,
)
from app.services.platform_auth_service import (
    forgot_platform_password,
    login_platform_user,
    reset_platform_password,
    verify_platform_mfa,
)

router = APIRouter(prefix="/platform-auth", tags=["Platform Authentication"])


@router.post("/login", response_model=PlatformLoginResponse)
def platform_login(payload: PlatformLoginRequest):
    result = login_platform_user(payload.email, payload.password)
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"],
    }


@router.post("/logout", response_model=PlatformMessageResponse)
def platform_logout():
    return {"message": "Titan logout succeeded."}


@router.post("/mfa/verify", response_model=PlatformMessageResponse)
def platform_mfa_verify(payload: PlatformMfaVerifyRequest):
    return verify_platform_mfa(payload.email, payload.mfa_code)


@router.post("/password/forgot", response_model=PlatformMessageResponse)
def platform_forgot_password(payload: PlatformForgotPasswordRequest):
    return forgot_platform_password(payload.email)


@router.post("/password/reset", response_model=PlatformMessageResponse)
def platform_reset_password(payload: PlatformResetPasswordRequest):
    return reset_platform_password(payload.reset_token, payload.new_password)


@router.get("/me", response_model=PlatformUserSummary)
def platform_me(current_user: dict = Depends(get_current_platform_user)):
    return current_user