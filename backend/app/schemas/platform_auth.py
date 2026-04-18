from typing import List

from pydantic import BaseModel


class PlatformUserSummary(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role_names: List[str]
    permissions: List[str]
    is_active: bool
    mfa_enabled: bool


class PlatformLoginRequest(BaseModel):
    email: str
    password: str


class PlatformLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PlatformUserSummary


class PlatformMfaVerifyRequest(BaseModel):
    email: str
    mfa_code: str


class PlatformMessageResponse(BaseModel):
    message: str


class PlatformForgotPasswordRequest(BaseModel):
    email: str


class PlatformResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str