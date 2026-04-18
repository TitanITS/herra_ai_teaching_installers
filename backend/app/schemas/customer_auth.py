from typing import List

from pydantic import BaseModel


class CustomerUserSummary(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role_names: List[str]
    permissions: List[str]
    customer_account_id: int
    customer_account_name: str
    is_active: bool
    mfa_enabled: bool


class CustomerLoginRequest(BaseModel):
    email: str
    password: str


class CustomerLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CustomerUserSummary


class CustomerMfaVerifyRequest(BaseModel):
    email: str
    mfa_code: str


class CustomerMessageResponse(BaseModel):
    message: str


class CustomerForgotPasswordRequest(BaseModel):
    email: str


class CustomerResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class CustomerInviteDetailsResponse(BaseModel):
    token: str
    email: str
    first_name: str
    last_name: str
    customer_account_name: str
    role_names: List[str]
    is_valid: bool
    expires_at: str


class CustomerInviteAcceptRequest(BaseModel):
    new_password: str
    mfa_code: str