from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission, require_platform_permission
from app.schemas.deployments import (
    CustomerDeploymentLaunchResponse,
    CustomerDeploymentSummary,
    DeploymentEventSummary,
    DeploymentHealthSummary,
    PlatformDeploymentDetail,
    PlatformDeploymentListItem,
)
from app.services.deployment_service import (
    get_customer_deployment,
    get_customer_deployment_events,
    get_customer_deployment_health,
    get_platform_deployment_detail,
    get_platform_deployment_events,
    get_platform_deployment_health,
    launch_customer_deployment,
    list_platform_deployments,
)

router = APIRouter(tags=["Deployments"])


@router.get("/customer/deployment", response_model=CustomerDeploymentSummary, tags=["Customer Deployment"])
def customer_deployment(
    current_user: dict = Depends(require_customer_permission("deployment.view")),
):
    return get_customer_deployment(current_user)


@router.get("/customer/deployment/health", response_model=DeploymentHealthSummary, tags=["Customer Deployment"])
def customer_deployment_health(
    current_user: dict = Depends(require_customer_permission("deployment.view_health")),
):
    return get_customer_deployment_health(current_user)


@router.get("/customer/deployment/events", response_model=List[DeploymentEventSummary], tags=["Customer Deployment"])
def customer_deployment_events(
    current_user: dict = Depends(require_customer_permission("deployment.view")),
):
    return get_customer_deployment_events(current_user)


@router.post("/customer/deployment/launch", response_model=CustomerDeploymentLaunchResponse, tags=["Customer Deployment"])
def customer_deployment_launch(
    current_user: dict = Depends(require_customer_permission("deployment.launch")),
):
    return launch_customer_deployment(current_user)


@router.get("/platform/deployments", response_model=List[PlatformDeploymentListItem], tags=["Platform Deployments"])
def platform_deployments(
    current_user: dict = Depends(require_platform_permission("platform_deployments.view")),
):
    _ = current_user
    return list_platform_deployments()


@router.get("/platform/deployments/{deployment_id}", response_model=PlatformDeploymentDetail, tags=["Platform Deployments"])
def platform_deployment_detail(
    deployment_id: int,
    current_user: dict = Depends(require_platform_permission("platform_deployments.view")),
):
    _ = current_user
    return get_platform_deployment_detail(deployment_id)


@router.get("/platform/deployments/{deployment_id}/health", response_model=DeploymentHealthSummary, tags=["Platform Deployments"])
def platform_deployment_health(
    deployment_id: int,
    current_user: dict = Depends(require_platform_permission("platform_deployments.view")),
):
    _ = current_user
    return get_platform_deployment_health(deployment_id)


@router.get("/platform/deployments/{deployment_id}/events", response_model=List[DeploymentEventSummary], tags=["Platform Deployments"])
def platform_deployment_events(
    deployment_id: int,
    current_user: dict = Depends(require_platform_permission("platform_deployments.view")),
):
    _ = current_user
    return get_platform_deployment_events(deployment_id)