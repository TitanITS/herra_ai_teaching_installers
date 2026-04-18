from typing import List

from pydantic import BaseModel


class BillingInvoiceSummary(BaseModel):
    invoice_number: str
    invoice_date: str
    amount_due: str
    status: str
    hosted_invoice_url: str = ""
    pdf_url: str = ""


class BillingPaymentMethodSummary(BaseModel):
    brand: str
    last4: str
    exp_month: str
    exp_year: str
    is_available: bool


class BillingContactSummary(BaseModel):
    name: str
    title: str
    email: str
    phone: str


class BillingSummaryResponse(BaseModel):
    current_plan: str
    subscription_status: str
    billing_period_start: str
    billing_period_end: str
    contracted_tokens: int
    tokens_used: int
    tokens_remaining: int
    connector_count: int
    connector_monthly_rate: str
    base_monthly_rate: str
    estimated_monthly_total: str
    payment_method: BillingPaymentMethodSummary
    billing_contacts: List[BillingContactSummary]
    invoices: List[BillingInvoiceSummary]


class BillingPortalSessionResponse(BaseModel):
    url: str


class BillingWebhookResponse(BaseModel):
    received: bool
    event_type: str