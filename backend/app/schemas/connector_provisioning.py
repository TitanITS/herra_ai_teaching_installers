from typing import List, Optional

from pydantic import BaseModel, Field


class ConnectorReleaseSummary(BaseModel):
    id: int
    release_code: str
    name: str
    operating_system: str
    architecture: str
    version: str
    filename: str
    download_url: str
    checksum_sha256: str
    install_notes: str
    is_active: bool
    is_latest: bool
    released_at: str


class DeploymentConnectorSlotSummary(BaseModel):
    slot_id: int
    deployment_id: int
    connector_name: str
    site_label: str
    status: str
    included_in_plan: bool
    operating_system: Optional[str] = None
    architecture: Optional[str] = None
    release_id: Optional[int] = None
    release_name: Optional[str] = None
    release_version: Optional[str] = None
    installer_filename: Optional[str] = None
    installer_download_url: Optional[str] = None
    install_notes: Optional[str] = None
    bootstrap_status: str
    last_bootstrap_created_at: Optional[str] = None
    last_bootstrap_expires_at: Optional[str] = None
    last_bootstrap_used: bool = False
    last_bootstrap_used_at: Optional[str] = None
    last_bootstrap_used_by_name: Optional[str] = None


class CustomerDeploymentProvisioningSummary(BaseModel):
    deployment_id: int
    deployment_name: str
    deployment_code: str
    included_connector_count: int
    additional_connector_count: int
    total_connector_count: int
    connector_releases: List[ConnectorReleaseSummary]
    connector_slots: List[DeploymentConnectorSlotSummary]


class PlatformDeploymentProvisioningSummary(CustomerDeploymentProvisioningSummary):
    customer_account_id: int
    customer_account_name: str


class ProvisioningBootstrapCreateRequest(BaseModel):
    slot_id: int
    release_id: int
    expires_minutes: int = Field(default=60, ge=5, le=1440)
    connector_name: Optional[str] = None
    site_label: Optional[str] = None


class ProvisioningBootstrapResponse(BaseModel):
    slot_id: int
    release_id: int
    bootstrap_id: str
    bootstrap_token: str
    bootstrap_label: str
    bootstrap_expires_at: str
    connector_name: str
    operating_system: str
    architecture: str
    installer_filename: str
    installer_download_url: str
    install_notes: str
    message: str