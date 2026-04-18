from typing import List

from pydantic import BaseModel


class PlatformTechnicianWorkspaceCustomerListItem(BaseModel):
    id: int
    name: str
    status: str
    primary_contact_name: str
    primary_contact_email: str
    deployment_count: int
    connector_count: int


class PlatformTechnicianWorkspaceContact(BaseModel):
    contact_type: str
    name: str
    title: str
    email: str
    phone: str


class PlatformTechnicianWorkspaceDeployment(BaseModel):
    id: int
    name: str
    deployment_code: str
    status: str
    health_status: str
    environment_type: str
    region: str
    version: str
    launch_url: str
    last_seen_at: str


class PlatformTechnicianWorkspaceConnector(BaseModel):
    id: int
    name: str
    connector_type: str
    status: str
    health_status: str
    sync_mode: str
    auth_mode: str
    target_system: str
    last_sync_at: str


class PlatformTechnicianWorkspaceDetail(BaseModel):
    customer_id: int
    customer_name: str
    customer_status: str
    timezone: str
    primary_contact_name: str
    primary_contact_email: str
    billing_email: str
    notes: str
    contacts: List[PlatformTechnicianWorkspaceContact]
    deployments: List[PlatformTechnicianWorkspaceDeployment]
    connectors: List[PlatformTechnicianWorkspaceConnector]