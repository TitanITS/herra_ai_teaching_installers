from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission, require_platform_permission
from app.schemas.connector_provisioning import (
    ConnectorReleaseSummary,
    CustomerDeploymentProvisioningSummary,
    PlatformDeploymentProvisioningSummary,
    ProvisioningBootstrapCreateRequest,
    ProvisioningBootstrapResponse,
)
from app.services.connector_provisioning_service import (
    create_customer_deployment_bootstrap,
    create_platform_deployment_bootstrap,
    get_customer_deployment_provisioning,
    get_platform_deployment_provisioning,
    list_connector_releases,
)

router = APIRouter(tags=["Connector Provisioning"])


@router.get(
    "/customer/deployment/provisioning",
    response_model=CustomerDeploymentProvisioningSummary,
    tags=["Customer Deployment Provisioning"],
)
def customer_deployment_provisioning(
    current_user: dict = Depends(require_customer_permission("deployment.view")),
):
    return get_customer_deployment_provisioning(current_user)


@router.post(
    "/customer/deployment/provisioning/bootstrap",
    response_model=ProvisioningBootstrapResponse,
    tags=["Customer Deployment Provisioning"],
)
def customer_deployment_provisioning_bootstrap(
    payload: ProvisioningBootstrapCreateRequest,
    current_user: dict = Depends(require_customer_permission("deployment.launch")),
):
    return create_customer_deployment_bootstrap(current_user, payload.model_dump())


@router.get(
    "/platform/connector-releases",
    response_model=list[ConnectorReleaseSummary],
    tags=["Platform Connector Provisioning"],
)
def platform_connector_releases(
    current_user: dict = Depends(require_platform_permission("platform_connectors.view")),
):
    _ = current_user
    return list_connector_releases()


@router.get(
    "/platform/deployments/{deployment_id}/provisioning",
    response_model=PlatformDeploymentProvisioningSummary,
    tags=["Platform Connector Provisioning"],
)
def platform_deployment_provisioning(
    deployment_id: int,
    current_user: dict = Depends(require_platform_permission("platform_deployments.view")),
):
    _ = current_user
    return get_platform_deployment_provisioning(deployment_id)


@router.post(
    "/platform/deployments/{deployment_id}/provisioning/bootstrap",
    response_model=ProvisioningBootstrapResponse,
    tags=["Platform Connector Provisioning"],
)
def platform_deployment_provisioning_bootstrap(
    deployment_id: int,
    payload: ProvisioningBootstrapCreateRequest,
    current_user: dict = Depends(require_platform_permission("platform_connectors.manage")),
):
    return create_platform_deployment_bootstrap(deployment_id, payload.model_dump(), current_user)