from fastapi import APIRouter, Depends, Header, Request

from app.api.deps import get_current_customer_user
from app.schemas.billing import (
    BillingPortalSessionResponse,
    BillingSummaryResponse,
    BillingWebhookResponse,
)
from app.services.billing_service import (
    create_customer_billing_portal_session,
    get_customer_billing_summary,
    handle_billing_webhook,
)

router = APIRouter(tags=["Customer Billing"])


@router.get("/customer/billing/summary", response_model=BillingSummaryResponse)
def customer_billing_summary(current_user: dict = Depends(get_current_customer_user)):
    return get_customer_billing_summary(current_user)


@router.post("/customer/billing/portal", response_model=BillingPortalSessionResponse)
def customer_billing_portal(current_user: dict = Depends(get_current_customer_user)):
    return create_customer_billing_portal_session(current_user)


@router.post("/billing/webhook", response_model=BillingWebhookResponse)
async def billing_webhook(
    request: Request,
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
):
    payload = await request.body()
    return handle_billing_webhook(payload, stripe_signature)