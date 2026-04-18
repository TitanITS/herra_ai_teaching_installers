from typing import List

from pydantic import BaseModel


class ConnectorHealthSummary(BaseModel):
    health_status: str
    last_reported_at: str
    success_rate_percent: int
    queue_depth: int


class ConnectorJobSummary(BaseModel):
    id: int
    job_type: str
    status: str
    result_summary: str
    created_at: str


class ConnectorEventSummary(BaseModel):
    id: int
    event_type: str
    severity: str
    message: str
    created_at: str


class CustomerConnectorListItem(BaseModel):
    id: int
    deployment_id: int
    connector_code: str
    name: str
    status: str
    version: str
    health_status: str
    last_sync_at: str
    connector_type: str
    sync_mode: str
    auth_mode: str
    target_system: str


class CustomerConnectorDetail(BaseModel):
    id: int
    deployment_id: int
    connector_code: str
    name: str
    status: str
    version: str
    health_status: str
    last_sync_at: str
    connector_type: str
    sync_mode: str
    auth_mode: str
    target_system: str
    available_actions: List[str]
    events: List[ConnectorEventSummary]


class ConnectorActionResponse(BaseModel):
    message: str
    connector_id: int
    action_code: str
    status: str


class PlatformConnectorListItem(BaseModel):
    id: int
    customer_account_id: int
    customer_account_name: str
    deployment_id: int
    connector_code: str
    name: str
    status: str
    version: str
    health_status: str
    last_sync_at: str
    connector_type: str
    sync_mode: str
    auth_mode: str
    target_system: str


class PlatformConnectorDetail(BaseModel):
    id: int
    customer_account_id: int
    customer_account_name: str
    deployment_id: int
    connector_code: str
    name: str
    status: str
    version: str
    health_status: str
    last_sync_at: str
    connector_type: str
    sync_mode: str
    auth_mode: str
    target_system: str
    available_actions: List[str]
    events: List[ConnectorEventSummary]