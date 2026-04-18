from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_customer_permission, require_platform_permission
from app.schemas.connectors import (
    ConnectorActionResponse,
    ConnectorHealthSummary,
    ConnectorJobSummary,
    CustomerConnectorDetail,
    CustomerConnectorListItem,
    PlatformConnectorDetail,
    PlatformConnectorListItem,
)
from app.services.connector_service import (
    get_customer_connector_detail,
    get_customer_connector_health,
    get_customer_connector_jobs,
    get_platform_connector_detail,
    get_platform_connector_health,
    get_platform_connector_jobs,
    list_customer_connectors,
    list_platform_connectors,
    run_customer_connector_action,
    run_platform_connector_action,
)

router = APIRouter(tags=["Connectors"])


@router.get("/customer/connectors", response_model=List[CustomerConnectorListItem], tags=["Customer Connectors"])
def customer_connectors(
    current_user: dict = Depends(require_customer_permission("connectors.view")),
):
    return list_customer_connectors(current_user)


@router.get("/customer/connectors/{connector_id}", response_model=CustomerConnectorDetail, tags=["Customer Connectors"])
def customer_connector_detail(
    connector_id: int,
    current_user: dict = Depends(require_customer_permission("connectors.view")),
):
    return get_customer_connector_detail(current_user, connector_id)


@router.get("/customer/connectors/{connector_id}/health", response_model=ConnectorHealthSummary, tags=["Customer Connectors"])
def customer_connector_health(
    connector_id: int,
    current_user: dict = Depends(require_customer_permission("connectors.view_health")),
):
    return get_customer_connector_health(current_user, connector_id)


@router.get("/customer/connectors/{connector_id}/jobs", response_model=List[ConnectorJobSummary], tags=["Customer Connectors"])
def customer_connector_jobs(
    connector_id: int,
    current_user: dict = Depends(require_customer_permission("connectors.view")),
):
    return get_customer_connector_jobs(current_user, connector_id)


@router.post("/customer/connectors/{connector_id}/actions/{action_code}", response_model=ConnectorActionResponse, tags=["Customer Connectors"])
def customer_connector_action(
    connector_id: int,
    action_code: str,
    current_user: dict = Depends(require_customer_permission("connectors.run_action")),
):
    return run_customer_connector_action(current_user, connector_id, action_code)


@router.get("/platform/connectors", response_model=List[PlatformConnectorListItem], tags=["Platform Connectors"])
def platform_connectors(
    current_user: dict = Depends(require_platform_permission("platform_connectors.view")),
):
    _ = current_user
    return list_platform_connectors()


@router.get("/platform/connectors/{connector_id}", response_model=PlatformConnectorDetail, tags=["Platform Connectors"])
def platform_connector_detail(
    connector_id: int,
    current_user: dict = Depends(require_platform_permission("platform_connectors.view")),
):
    _ = current_user
    return get_platform_connector_detail(connector_id)


@router.get("/platform/connectors/{connector_id}/health", response_model=ConnectorHealthSummary, tags=["Platform Connectors"])
def platform_connector_health(
    connector_id: int,
    current_user: dict = Depends(require_platform_permission("platform_connectors.view")),
):
    _ = current_user
    return get_platform_connector_health(connector_id)


@router.get("/platform/connectors/{connector_id}/jobs", response_model=List[ConnectorJobSummary], tags=["Platform Connectors"])
def platform_connector_jobs(
    connector_id: int,
    current_user: dict = Depends(require_platform_permission("platform_connectors.view")),
):
    _ = current_user
    return get_platform_connector_jobs(connector_id)


@router.post("/platform/connectors/{connector_id}/actions/{action_code}", response_model=ConnectorActionResponse, tags=["Platform Connectors"])
def platform_connector_action(
    connector_id: int,
    action_code: str,
    current_user: dict = Depends(require_platform_permission("platform_connectors.manage")),
):
    _ = current_user
    return run_platform_connector_action(connector_id, action_code)