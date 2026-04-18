from pydantic import BaseModel


class PublicDemoRequestCreateRequest(BaseModel):
    full_name: str
    company_name: str
    email: str
    phone: str = ""
    deployment_interest: str
    estimated_usage: str = ""
    message: str


class PublicDemoRequestCreateResponse(BaseModel):
    message: str
    delivery_mode: str