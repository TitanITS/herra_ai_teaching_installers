from typing import List, Optional

from pydantic import BaseModel, EmailStr


class CustomerUserListItem(BaseModel):
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
    invite_pending: bool


class CustomerUserCreateRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role_names: List[str]


class CustomerUserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class CustomerUserRolesUpdateRequest(BaseModel):
    role_names: List[str]


class CustomerUserMessageResponse(BaseModel):
    message: str


class CustomerUserInviteResponse(BaseModel):
    message: str
    invite_token: str
    user: CustomerUserListItem