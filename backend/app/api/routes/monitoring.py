from fastapi import APIRouter, Depends

from app.api.deps import require_platform_permission
from app.schemas.monitoring import PlatformMonitoringSummary
from app.services.monitoring_service import get_platform_monitoring_summary

router = APIRouter(prefix="/platform/monitoring", tags=["Platform Monitoring"])


@router.get("/summary", response_model=PlatformMonitoringSummary)
def platform_monitoring_summary(
    current_user: dict = Depends(require_platform_permission("platform_monitoring.view")),
):
    _ = current_user
    return get_platform_monitoring_summary()