from fastapi import APIRouter, Depends

from app.api.deps import get_current_customer_user
from app.schemas.customer_auth import (
    CustomerForgotPasswordRequest,
    CustomerInviteAcceptRequest,
    CustomerInviteDetailsResponse,
    CustomerLoginRequest,
    CustomerLoginResponse,
    CustomerMessageResponse,
    CustomerMfaVerifyRequest,
    CustomerResetPasswordRequest,
    CustomerUserSummary,
)
from app.services.customer_auth_service import (
    accept_invite,
    forgot_customer_password,
    get_invite_details,
    login_customer,
    reset_customer_password,
    verify_customer_mfa,
)

router = APIRouter(prefix="/customer-auth", tags=["Customer Authentication"])


@router.post("/login", response_model=CustomerLoginResponse)
def customer_login(payload: CustomerLoginRequest):
    result = login_customer(payload.email, payload.password)
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"],
    }


@router.post("/logout", response_model=CustomerMessageResponse)
def customer_logout():
    return {"message": "Customer logout succeeded."}


@router.post("/mfa/verify", response_model=CustomerMessageResponse)
def customer_mfa_verify(payload: CustomerMfaVerifyRequest):
    return verify_customer_mfa(payload.email, payload.mfa_code)


@router.post("/password/forgot", response_model=CustomerMessageResponse)
def customer_forgot_password(payload: CustomerForgotPasswordRequest):
    return forgot_customer_password(payload.email)


@router.post("/password/reset", response_model=CustomerMessageResponse)
def customer_reset_password(payload: CustomerResetPasswordRequest):
    return reset_customer_password(payload.reset_token, payload.new_password)


@router.get("/me", response_model=CustomerUserSummary)
def customer_me(current_user: dict = Depends(get_current_customer_user)):
    return current_user


@router.get("/invite/{token}", response_model=CustomerInviteDetailsResponse)
def customer_invite_details(token: str):
    return get_invite_details(token)


@router.post("/invite/{token}/accept", response_model=CustomerLoginResponse)
def customer_accept_invite(token: str, payload: CustomerInviteAcceptRequest):
    result = accept_invite(token, payload.new_password, payload.mfa_code)
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"],
    }