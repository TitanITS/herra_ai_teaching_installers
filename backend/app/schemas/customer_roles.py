from typing import List

from pydantic import BaseModel


class CustomerRoleSummary(BaseModel):
    name: str
    permissions: List[str]


class CustomerPermissionSummary(BaseModel):
    code: str