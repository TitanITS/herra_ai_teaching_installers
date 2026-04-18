import hmac
import json
from hashlib import sha256
from typing import Any, Dict
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings
from app.core.exceptions import bad_request_exception
from app.services.customer_account_service import DEV_CUSTOMER_CONTACTS

STRIPE_API_BASE_URL = "https://api.stripe.com/v1"

DEV_BILLING_STATE: Dict[int, Dict[str, Any]] = {
    1: {
        "current_plan": "Herra Cloud SaaS",
        "subscription_status": "Active",
        "billing_period_start": "2026-04-01",
        "billing_period_end": "2026-04-30",
        "contracted_tokens": 100000,
        "tokens_used": 18320,
        "connector_count": 1,
        "connector_monthly_rate": "$149.00",
        "base_monthly_rate": "$299.00",
        "estimated_monthly_total": "$448.00",
        "stripe_customer_id": "",
        "payment_method": {
            "brand": "",
            "last4": "",
            "exp_month": "",
            "exp_year": "",
            "is_available": False,
        },
        "invoices": [],
    }
}


def _get_account_state(customer_account_id: int) -> Dict[str, Any]:
    state = DEV_BILLING_STATE.setdefault(
        customer_account_id,
        {
            "current_plan": "Herra Cloud SaaS",
            "subscription_status": "Active",
            "billing_period_start": "2026-04-01",
            "billing_period_end": "2026-04-30",
            "contracted_tokens": 100000,
            "tokens_used": 0,
            "connector_count": 1,
            "connector_monthly_rate": "$149.00",
            "base_monthly_rate": "$299.00",
            "estimated_monthly_total": "$448.00",
            "stripe_customer_id": "",
            "payment_method": {
                "brand": "",
                "last4": "",
                "exp_month": "",
                "exp_year": "",
                "is_available": False,
            },
            "invoices": [],
        },
    )
    state["tokens_remaining"] = max(state["contracted_tokens"] - state["tokens_used"], 0)
    return state


def _serialize_amount(cents: int | float) -> str:
    return f"${(int(cents) / 100):,.2f}"


def _stripe_request(method: str, path: str, data: Dict[str, Any] | None = None) -> Dict[str, Any]:
    if not settings.STRIPE_SECRET_KEY:
        raise bad_request_exception("Stripe secret key is not configured in backend .env.")

    url = f"{STRIPE_API_BASE_URL}{path}"
    body = None
    headers = {
        "Authorization": f"Bearer {settings.STRIPE_SECRET_KEY}",
    }

    if data is not None:
        body = urlencode(data, doseq=True).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    request = Request(url=url, data=body, headers=headers, method=method.upper())

    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            error_payload = json.loads(exc.read().decode("utf-8"))
            message = error_payload.get("error", {}).get("message", "Stripe request failed.")
        except Exception:
            message = "Stripe request failed."
        raise bad_request_exception(message) from exc
    except URLError as exc:
        raise bad_request_exception("Could not reach Stripe API.") from exc


def _ensure_stripe_customer(current_user: Dict[str, Any]) -> str:
    state = _get_account_state(current_user["customer_account_id"])
    existing_customer_id = state.get("stripe_customer_id", "")
    if existing_customer_id:
        return existing_customer_id

    customer = _stripe_request(
        "POST",
        "/customers",
        {
            "name": current_user["customer_account_name"],
            "email": current_user["email"],
            "metadata[customer_account_id]": str(current_user["customer_account_id"]),
            "metadata[customer_account_name]": current_user["customer_account_name"],
        },
    )
    customer_id = customer.get("id", "")
    if not customer_id:
        raise bad_request_exception("Stripe customer creation failed.")

    state["stripe_customer_id"] = customer_id
    return customer_id


def _refresh_payment_method_summary(state: Dict[str, Any], stripe_customer_id: str) -> None:
    payment_methods = _stripe_request(
        "GET",
        f"/payment_methods?{urlencode({'customer': stripe_customer_id, 'type': 'card'})}",
    )
    items = payment_methods.get("data", [])
    if not items:
        state["payment_method"] = {
            "brand": "No payment method on file",
            "last4": "",
            "exp_month": "",
            "exp_year": "",
            "is_available": False,
        }
        return

    card = items[0].get("card", {})
    state["payment_method"] = {
        "brand": str(card.get("brand", "Card")).title(),
        "last4": str(card.get("last4", "")),
        "exp_month": str(card.get("exp_month", "")),
        "exp_year": str(card.get("exp_year", "")),
        "is_available": True,
    }


def _refresh_invoice_summary(state: Dict[str, Any], stripe_customer_id: str) -> None:
    invoices = _stripe_request(
        "GET",
        f"/invoices?{urlencode({'customer': stripe_customer_id, 'limit': 10})}",
    )
    state["invoices"] = [
        {
            "invoice_number": invoice.get("number") or invoice.get("id", ""),
            "invoice_date": str(invoice.get("created", "")),
            "amount_due": _serialize_amount(invoice.get("amount_due", 0)),
            "status": str(invoice.get("status", "Open")).title(),
            "hosted_invoice_url": invoice.get("hosted_invoice_url", "") or "",
            "pdf_url": invoice.get("invoice_pdf", "") or "",
        }
        for invoice in invoices.get("data", [])
    ]


def get_customer_billing_summary(current_user: Dict[str, Any]) -> Dict[str, Any]:
    state = _get_account_state(current_user["customer_account_id"])

    stripe_customer_id = state.get("stripe_customer_id", "")
    if settings.STRIPE_SECRET_KEY and stripe_customer_id:
        _refresh_payment_method_summary(state, stripe_customer_id)
        _refresh_invoice_summary(state, stripe_customer_id)

    billing_contacts = [
        {
            "name": contact["full_name"],
            "title": contact["title"],
            "email": contact["email"],
            "phone": contact["main_phone"],
        }
        for contact in DEV_CUSTOMER_CONTACTS.get(current_user["customer_account_id"], [])
        if contact["permission_role"] in {"Billing", "Administrator"}
    ]

    if not billing_contacts:
        billing_contacts = [
            {
                "name": f'{current_user["first_name"]} {current_user["last_name"]}',
                "title": "Primary Billing Contact",
                "email": current_user["email"],
                "phone": "",
            }
        ]

    return {
        "current_plan": state["current_plan"],
        "subscription_status": state["subscription_status"],
        "billing_period_start": state["billing_period_start"],
        "billing_period_end": state["billing_period_end"],
        "contracted_tokens": state["contracted_tokens"],
        "tokens_used": state["tokens_used"],
        "tokens_remaining": state["tokens_remaining"],
        "connector_count": state["connector_count"],
        "connector_monthly_rate": state["connector_monthly_rate"],
        "base_monthly_rate": state["base_monthly_rate"],
        "estimated_monthly_total": state["estimated_monthly_total"],
        "payment_method": state["payment_method"],
        "billing_contacts": billing_contacts,
        "invoices": state["invoices"],
    }


def create_customer_billing_portal_session(current_user: Dict[str, Any]) -> Dict[str, str]:
    stripe_customer_id = _ensure_stripe_customer(current_user)
    session = _stripe_request(
        "POST",
        "/billing_portal/sessions",
        {
            "customer": stripe_customer_id,
            "return_url": settings.STRIPE_CUSTOMER_PORTAL_RETURN_URL,
        },
    )
    url = session.get("url", "")
    if not url:
        raise bad_request_exception("Stripe customer portal session could not be created.")
    return {"url": url}


def _verify_webhook_signature(payload: bytes, signature_header: str) -> None:
    secret = settings.STRIPE_WEBHOOK_SECRET
    if not secret:
        raise bad_request_exception("Stripe webhook secret is not configured in backend .env.")

    parts: Dict[str, str] = {}
    for item in signature_header.split(","):
        if "=" in item:
            key, value = item.split("=", 1)
            parts[key] = value

    timestamp = parts.get("t", "")
    expected_signature = parts.get("v1", "")
    if not timestamp or not expected_signature:
        raise bad_request_exception("Invalid Stripe webhook signature header.")

    signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode("utf-8")
    computed = hmac.new(secret.encode("utf-8"), signed_payload, sha256).hexdigest()
    if not hmac.compare_digest(computed, expected_signature):
        raise bad_request_exception("Stripe webhook signature verification failed.")


def handle_billing_webhook(payload: bytes, signature_header: str) -> Dict[str, Any]:
    _verify_webhook_signature(payload, signature_header)
    event = json.loads(payload.decode("utf-8"))
    event_type = event.get("type", "unknown")

    data_object = event.get("data", {}).get("object", {})
    customer_id = data_object.get("customer", "")

    if customer_id:
        for state in DEV_BILLING_STATE.values():
            if state.get("stripe_customer_id") == customer_id:
                if event_type == "invoice.paid":
                    state["subscription_status"] = "Active"
                elif event_type == "invoice.payment_failed":
                    state["subscription_status"] = "Past Due"
                elif event_type == "customer.subscription.deleted":
                    state["subscription_status"] = "Canceled"
                elif event_type == "customer.subscription.updated":
                    state["subscription_status"] = str(
                        data_object.get("status", "Active")
                    ).replace("_", " ").title()
                break

    return {"received": True, "event_type": event_type}