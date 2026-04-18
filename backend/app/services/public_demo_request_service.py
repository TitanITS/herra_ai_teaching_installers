import json
import smtplib
import urllib.error
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.exceptions import bad_request_exception
from app.schemas.public_demo_requests import PublicDemoRequestCreateRequest


def _normalize(value: str) -> str:
    return " ".join(value.strip().split())


def _build_demo_request_record(payload: PublicDemoRequestCreateRequest) -> Dict[str, Any]:
    full_name = _normalize(payload.full_name)
    company_name = _normalize(payload.company_name)
    email = _normalize(payload.email)
    phone = _normalize(payload.phone)
    deployment_interest = _normalize(payload.deployment_interest)
    estimated_usage = _normalize(payload.estimated_usage)
    message = payload.message.strip()

    if not full_name:
        raise bad_request_exception("Full name is required.")

    if not company_name:
        raise bad_request_exception("Company name is required.")

    if not email:
        raise bad_request_exception("Email is required.")

    if not deployment_interest:
        raise bad_request_exception("Deployment interest is required.")

    if not message:
        raise bad_request_exception("Message is required.")

    return {
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "full_name": full_name,
        "company_name": company_name,
        "email": email,
        "phone": phone,
        "deployment_interest": deployment_interest,
        "estimated_usage": estimated_usage,
        "message": message,
    }


def _build_email_body(record: Dict[str, Any]) -> str:
    return (
        "A new Titan Nexus Tech demo request was submitted.\n\n"
        f"Submitted At: {record['submitted_at']}\n"
        f"Full Name: {record['full_name']}\n"
        f"Company Name: {record['company_name']}\n"
        f"Email: {record['email']}\n"
        f"Phone: {record['phone'] or 'Not provided'}\n"
        f"Deployment Interest: {record['deployment_interest']}\n"
        f"Estimated Usage: {record['estimated_usage'] or 'Not provided'}\n\n"
        "Message:\n"
        f"{record['message']}\n"
    )


def _build_email_message(record: Dict[str, Any]) -> EmailMessage:
    email_message = EmailMessage()
    email_message["Subject"] = "Titan Nexus Tech Demo Request"
    email_message["From"] = settings.DEMO_REQUEST_FROM_EMAIL
    email_message["To"] = settings.DEMO_REQUEST_TO_EMAIL
    email_message["Reply-To"] = record["email"]
    email_message.set_content(_build_email_body(record))
    return email_message


def _store_demo_request_locally(record: Dict[str, Any]) -> None:
    runtime_dir = Path("runtime")
    runtime_dir.mkdir(parents=True, exist_ok=True)

    output_path = runtime_dir / "demo_requests.jsonl"
    with output_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def _resend_is_configured() -> bool:
    return bool(
        settings.RESEND_API_KEY.strip()
        and settings.DEMO_REQUEST_FROM_EMAIL.strip()
        and settings.DEMO_REQUEST_TO_EMAIL.strip()
    )


def _smtp_is_configured() -> bool:
    return bool(
        settings.SMTP_HOST.strip()
        and settings.SMTP_USERNAME.strip()
        and settings.SMTP_PASSWORD.strip()
        and settings.DEMO_REQUEST_FROM_EMAIL.strip()
        and settings.DEMO_REQUEST_TO_EMAIL.strip()
    )


def _send_demo_request_via_resend(record: Dict[str, Any]) -> None:
    payload = {
        "from": settings.DEMO_REQUEST_FROM_EMAIL,
        "to": [settings.DEMO_REQUEST_TO_EMAIL],
        "subject": "Titan Nexus Tech Demo Request",
        "text": _build_email_body(record),
        "reply_to": record["email"],
    }

    request = urllib.request.Request(
        url="https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "titannexustech-api/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status_code = getattr(response, "status", 200)
            if status_code < 200 or status_code >= 300:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Email delivery failed with status {status_code}.",
                )
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Email delivery failed: {error_body}",
        ) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Email delivery failed: {exc.reason}",
        ) from exc


def _send_demo_request_email(record: Dict[str, Any]) -> None:
    email_message = _build_email_message(record)

    if settings.SMTP_USE_TLS:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(email_message)
        return

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(email_message)


def create_public_demo_request(payload: PublicDemoRequestCreateRequest) -> Dict[str, str]:
    record = _build_demo_request_record(payload)
    _store_demo_request_locally(record)

    if _resend_is_configured():
        _send_demo_request_via_resend(record)
        return {
            "message": "Demo request submitted successfully.",
            "delivery_mode": "resend_api",
        }

    if _smtp_is_configured():
        _send_demo_request_email(record)
        return {
            "message": "Demo request submitted successfully.",
            "delivery_mode": "email",
        }

    return {
        "message": "Demo request captured successfully. Email is not configured yet, so the request was stored locally.",
        "delivery_mode": "stored_only",
    }