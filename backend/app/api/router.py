from fastapi import APIRouter

from app.api.routes.billing import router as billing_router
from app.api.routes.connector_provisioning import router as connector_provisioning_router
from app.api.routes.connectors import router as connectors_router
from app.api.routes.customer_accounts import router as customer_accounts_router
from app.api.routes.customer_auth import router as customer_auth_router
from app.api.routes.customer_roles import router as customer_roles_router
from app.api.routes.customer_users import router as customer_users_router
from app.api.routes.deployments import router as deployments_router
from app.api.routes.platform_auth import router as platform_auth_router
from app.api.routes.platform_cases import router as platform_cases_router
from app.api.routes.platform_customers import router as platform_customers_router
from app.api.routes.platform_sales import router as platform_sales_router
from app.api.routes.platform_technician import router as platform_technician_router
from app.api.routes.public_demo_requests import router as public_demo_requests_router
from app.api.routes.settings import router as settings_router
from app.api.routes.support import router as support_router

api_router = APIRouter()

# Public website routes
api_router.include_router(public_demo_requests_router)

# Customer portal auth + account routes
api_router.include_router(customer_auth_router)
api_router.include_router(customer_accounts_router)
api_router.include_router(customer_roles_router)
api_router.include_router(customer_users_router)
api_router.include_router(deployments_router)
api_router.include_router(connectors_router)
api_router.include_router(connector_provisioning_router)
api_router.include_router(support_router)
api_router.include_router(billing_router)
api_router.include_router(settings_router)

# Internal Titan platform routes
api_router.include_router(platform_auth_router)
api_router.include_router(platform_sales_router)
api_router.include_router(platform_customers_router)
api_router.include_router(platform_cases_router)
api_router.include_router(platform_technician_router)