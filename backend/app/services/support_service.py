from copy import deepcopy
from typing import Any, Dict, List

from app.core.exceptions import bad_request_exception, forbidden_exception, not_found_exception
from app.services.customer_account_service import get_customer_account_manager
from app.services.platform_case_service import (
    DEV_PLATFORM_CASES,
    _ensure_case_defaults,
    _record_case_event,
    _serialize_case_events,
    _utc_now_iso,
    create_case,
)

DEV_SUPPORT_CONTACT = {
    "name": "Titan Customer Support",
    "title": "Support Desk",
    "email": "support@titanitsolutions.local",
    "phone": "1-800-555-0199",
    "hours": "Monday-Friday, 8:00 AM to 6:00 PM Eastern",
    "urgent_message": "For urgent service-impacting issues, create a High severity case and call the support desk.",
}

DEV_SUPPORT_SEVERITY_GUIDANCE = [
    {
        "level": "Low",
        "response_target": "Next business day",
        "description": "General questions, documentation requests, or low-impact issues.",
    },
    {
        "level": "Medium",
        "response_target": "Same business day",
        "description": "Connector warnings, partial sync issues, or non-critical deployment concerns.",
    },
    {
        "level": "High",
        "response_target": "Priority handling",
        "description": "Service-impacting issues that block a connector, deployment access, or critical workflow.",
    },
]

DEV_SUPPORT_QUICK_HELP = [
    {
        "id": 1,
        "title": "Connector credential rotation checklist",
        "description": "Use this before opening a case for connector authentication warnings after credential changes.",
    },
    {
        "id": 2,
        "title": "Deployment health status guide",
        "description": "Understand active, warning, and unhealthy deployment states and what they mean.",
    },
    {
        "id": 3,
        "title": "SharePoint and Microsoft 365 sync basics",
        "description": "Review first-step checks for SharePoint and Microsoft 365 connector sync issues.",
    },
    {
        "id": 4,
        "title": "When to open a High severity case",
        "description": "Use High severity only for service-impacting issues that need immediate attention.",
    },
]


def _normalize_whitespace(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _normalize_multiline(value: Any) -> str:
    lines = [str(line).rstrip() for line in str(value or "").replace("\r\n", "\n").split("\n")]
    return "\n".join(lines).strip()


def _map_severity_to_priority(severity: str) -> str:
    normalized = _normalize_whitespace(severity).title()
    if normalized not in {"Low", "Medium", "High"}:
        raise bad_request_exception("Severity must be Low, Medium, or High.")
    return normalized


def _map_priority_to_severity(priority: str) -> str:
    normalized = _normalize_whitespace(priority).title()
    if normalized == "Critical":
        return "High"
    if normalized in {"Low", "Medium", "High"}:
        return normalized
    return "Medium"


def _get_customer_status_label(status: str) -> str:
    normalized = _normalize_whitespace(status)
    if normalized in {"New", "Assigned", "In Progress", "Escalated"}:
        return "Titan is working on this case"
    if normalized == "Customer Pending":
        return "Waiting for your reply"
    if normalized == "Monitoring":
        return "Titan is monitoring this case"
    if normalized in {"Resolved", "Closed"}:
        return "Resolved and archived"
    return normalized or "Open"


def _classify_customer_timeline_event(event: Dict[str, Any]) -> Dict[str, str]:
    event_type = _normalize_whitespace(event.get("event_type")).lower()
    actor_name = str(event.get("actor_name") or "Titan Support")
    source_label = _normalize_whitespace(event.get("source_label"))
    message_text = _normalize_multiline(event.get("content") or event.get("message"))

    if event_type == "customer_reply":
        return {
            "author_name": actor_name,
            "author_type": "Customer",
            "author_label": "Customer",
            "entry_kind": source_label or "Customer Reply",
            "message": message_text,
        }

    if event_type in {"status_change", "created"} and actor_name.lower().find("system") >= 0:
        return {
            "author_name": actor_name,
            "author_type": "System",
            "author_label": "Titan System",
            "entry_kind": "System Update",
            "message": message_text,
        }

    if event_type == "general_notes":
        return {
            "author_name": actor_name,
            "author_type": "Titan",
            "author_label": "Titan Staff",
            "entry_kind": source_label or "Titan Reply",
            "message": message_text,
        }

    if event_type in {"assignment", "accepted", "reassignment", "escalation", "escalation_cleared", "status_change"}:
        return {
            "author_name": actor_name,
            "author_type": "System",
            "author_label": "Titan System",
            "entry_kind": "System Update",
            "message": message_text,
        }

    return {
        "author_name": actor_name,
        "author_type": "Titan",
        "author_label": "Titan Staff",
        "entry_kind": source_label or "Titan Update",
        "message": message_text,
    }


def _build_timeline_entries(case_id: int) -> List[Dict[str, Any]]:
    timeline_items: List[Dict[str, Any]] = []

    for event in _serialize_case_events(case_id):
        is_customer_visible = bool(event.get("is_customer_visible", False))
        if not is_customer_visible:
            continue

        classified_event = _classify_customer_timeline_event(event)
        message = classified_event["message"]
        if not message:
            continue

        timeline_items.append(
            {
                "id": int(event["id"]),
                "author_name": classified_event["author_name"],
                "author_type": classified_event["author_type"],
                "author_label": classified_event["author_label"],
                "entry_kind": classified_event["entry_kind"],
                "visibility": "Shared with customer",
                "is_customer_visible": True,
                "message": message,
                "source_label": _normalize_whitespace(event.get("source_label")),
                "created_at": str(event["created_at"]),
            }
        )

    return timeline_items


def _serialize_customer_support_case(case: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_defaults(case)
    internal_case_id = int(case["id"])
    support_subject = _normalize_whitespace(case.get("support_subject") or case.get("summary") or "Support Case")
    assigned_team = _normalize_whitespace(case.get("assigned_to_name") or "Titan Support")

    status = str(case.get("status") or "New")

    return {
        "id": internal_case_id,
        "internal_case_id": internal_case_id,
        "customer_account_id": int(case.get("customer_account_id") or case.get("customer_id") or 0),
        "case_number": str(case.get("shared_case_number") or f"TC-{case.get('case_number')}"),
        "subject": support_subject,
        "severity": _map_priority_to_severity(str(case.get("priority") or "Medium")),
        "status": status,
        "customer_status_label": _get_customer_status_label(status),
        "summary": _normalize_multiline(case.get("case_details") or case.get("summary") or ""),
        "created_at": str(case.get("created_at") or ""),
        "updated_at": str(case.get("updated_at") or ""),
        "assigned_team": assigned_team,
        "comments": _build_timeline_entries(internal_case_id),
    }


def list_customer_support_cases(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    customer_account_id = int(current_user["customer_account_id"])
    matching_cases = []

    for case in DEV_PLATFORM_CASES.values():
        _ensure_case_defaults(case)
        if int(case.get("customer_account_id") or case.get("customer_id") or 0) != customer_account_id:
            continue
        matching_cases.append(_serialize_customer_support_case(case))

    return sorted(matching_cases, key=lambda item: (item["updated_at"], item["internal_case_id"]), reverse=True)


def create_customer_support_case(
    current_user: Dict[str, Any],
    subject: str,
    severity: str,
    summary: str,
) -> Dict[str, Any]:
    normalized_subject = _normalize_whitespace(subject)
    normalized_summary = _normalize_multiline(summary)
    normalized_priority = _map_severity_to_priority(severity)

    if not normalized_subject:
        raise bad_request_exception("Subject is required.")

    if not normalized_summary:
        raise bad_request_exception("Summary is required.")

    customer_full_name = _normalize_whitespace(
        f'{current_user.get("first_name") or ""} {current_user.get("last_name") or ""}'
    ) or str(current_user.get("email") or "Customer")

    created_case = create_case(
        {
            "customer_id": int(current_user["customer_account_id"]),
            "contact_name": customer_full_name,
            "contact_email": str(current_user.get("email") or ""),
            "contact_phone": "",
            "issue_type": "Herra Operation Issue",
            "summary": normalized_subject,
            "support_subject": normalized_subject,
            "case_details": normalized_summary,
            "priority": normalized_priority,
            "submitted_by_type": "Customer",
        },
        {
            "first_name": str(current_user.get("first_name") or ""),
            "last_name": str(current_user.get("last_name") or ""),
            "email": str(current_user.get("email") or ""),
            "role_names": ["Customer Portal"],
        },
    )

    internal_case_id = int(created_case["id"])
    DEV_PLATFORM_CASES[internal_case_id]["support_subject"] = normalized_subject

    return {
        "message": f"Support case {created_case['shared_case_number']} created successfully.",
        "case": deepcopy(_serialize_customer_support_case(DEV_PLATFORM_CASES[internal_case_id])),
    }


def get_customer_support_resources(current_user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "account_manager": get_customer_account_manager(current_user),
        "support_contact": deepcopy(DEV_SUPPORT_CONTACT),
        "severity_guidance": deepcopy(DEV_SUPPORT_SEVERITY_GUIDANCE),
        "quick_help_articles": deepcopy(DEV_SUPPORT_QUICK_HELP),
    }


def _get_customer_owned_case_or_raise(case_id: int, current_user: Dict[str, Any]) -> Dict[str, Any]:
    case = DEV_PLATFORM_CASES.get(case_id)

    if not case:
        raise not_found_exception("Support case not found.")

    _ensure_case_defaults(case)

    customer_account_id = int(current_user["customer_account_id"])
    case_customer_account_id = int(case.get("customer_account_id") or case.get("customer_id") or 0)

    if case_customer_account_id != customer_account_id:
        raise forbidden_exception("You do not have access to this support case.")

    return case


def add_customer_support_case_reply(
    case_id: int,
    current_user: Dict[str, Any],
    message: str,
) -> Dict[str, Any]:
    case = _get_customer_owned_case_or_raise(case_id, current_user)
    normalized_message = _normalize_multiline(message)

    if not normalized_message:
        raise bad_request_exception("Reply message is required.")

    if str(case.get("status") or "") in {"Resolved", "Closed"}:
        raise bad_request_exception("Resolved or closed cases cannot receive new customer replies.")

    actor_name = _normalize_whitespace(
        f'{current_user.get("first_name") or ""} {current_user.get("last_name") or ""}'
    ) or str(current_user.get("email") or "Customer")
    updated_at = _utc_now_iso()
    previous_status = str(case.get("status") or "")

    _record_case_event(
        int(case["id"]),
        "customer_reply",
        actor_name,
        "",
        created_at=updated_at,
        source_label="Customer Reply",
        content=normalized_message,
        is_customer_visible=True,
    )

    if previous_status == "Customer Pending":
        case["status"] = "In Progress"
        _record_case_event(
            int(case["id"]),
            "status_change",
            "Titan System",
            "Customer replied. Status changed from Customer Pending to In Progress.",
            created_at=updated_at,
            is_customer_visible=True,
        )

    case["updated_at"] = updated_at
    shared_case_number = str(case.get("shared_case_number") or f"TC-{case.get('case_number')}")

    return {
        "message": f"Reply added to {shared_case_number}.",
        "case": deepcopy(_serialize_customer_support_case(case)),
    }