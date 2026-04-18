from typing import List

from pydantic import BaseModel


class DeploymentHealthSummary(BaseModel):
    health_status: str
    cpu_percent: int
    memory_percent: int
    last_reported_at: str


class DeploymentEventSummary(BaseModel):
    id: int
    event_type: str
    severity: str
    message: str
    created_at: str


class CustomerDeploymentSummary(BaseModel):
    id: int
    customer_account_id: int
    name: str
    deployment_code: str
    status: str
    version: str
    environment_type: str
    region: str
    launch_url: str
    health_status: str
    last_seen_at: str


class CustomerDeploymentLaunchResponse(BaseModel):
    launch_url: str
    message: str


class PlatformDeploymentListItem(BaseModel):
    id: int
    customer_account_id: int
    customer_account_name: str
    name: str
    deployment_code: str
    status: str
    version: str
    environment_type: str
    region: str
    health_status: str
    last_seen_at: str


class PlatformDeploymentDetail(BaseModel):
    id: int
    customer_account_id: int
    customer_account_name: str
    name: str
    deployment_code: str
    status: str
    version: str
    environment_type: str
    region: str
    launch_url: str
    health_status: str
    last_seen_at: str
    events: List[DeploymentEventSummary]