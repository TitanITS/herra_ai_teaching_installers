from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.exceptions import bad_request_exception, forbidden_exception, not_found_exception
from app.services.customer_account_service import DEV_CUSTOMER_ACCOUNTS, DEV_CUSTOMER_CONTACTS

CASE_NUMBER_START = 10000

CASE_STATUS_OPTIONS = {
    "New",
    "Assigned",
    "In Progress",
    "Customer Pending",
    "Monitoring",
    "Escalated",
    "Resolved",
}

CASE_PRIORITY_OPTIONS = {
    "Low",
    "Medium",
    "High",
    "Critical",
}

CASE_ISSUE_TYPE_OPTIONS = {
    "Herra Operation Issue",
    "Connector Issue",
}

CASE_ESCALATION_TARGET_OPTIONS = {
    "",
    "Engineer",
    "Programmer",
    "Account Manager",
}

CASE_SUBMITTED_BY_TYPE_OPTIONS = {
    "Staff",
    "Customer",
}

CASE_ACCEPT_ROLE_NAMES = {
    "Titan Technician",
    "Titan Support Admin",
    "Titan Super Admin",
    "Titan Management Admin",
    "Titan Operations Supervisor",
}

CASE_ASSIGN_ROLE_NAMES = {
    "Titan Support Admin",
    "Titan Super Admin",
    "Titan Management Admin",
    "Titan Operations Supervisor",
}

DEV_PLATFORM_CASES: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "case_number": 10000,
        "status": "In Progress",
        "priority": "High",
        "issue_type": "Connector Issue",
        "customer_id": 2,
        "customer_name": "Northwind Health Group",
        "contact_name": "Andre Hale",
        "contact_email": "andre.hale@northwindhealth.local",
        "contact_phone": "1-800-555-0120 ext 222",
        "submitted_by_type": "Customer",
        "created_by_name": "Customer Portal",
        "assigned_to_name": "Titan Technician",
        "escalation_target": "",
        "summary": "SharePoint connector sync stopped after credentials were rotated.",
        "case_details": (
            "Customer reported that the SharePoint connector stopped syncing after their Microsoft 365 "
            "credential rotation window completed."
        ),
        "general_notes": "",
        "internal_notes": "Likely auth refresh or secret update issue. Needs technician follow-up.",
        "created_at": "2026-03-26T13:15:00+00:00",
        "updated_at": "2026-03-27T14:40:00+00:00",
    },
    2: {
        "id": 2,
        "case_number": 10001,
        "status": "Monitoring",
        "priority": "Medium",
        "issue_type": "Herra Operation Issue",
        "customer_id": 1,
        "customer_name": "Demo Customer",
        "contact_name": "Primary Admin",
        "contact_email": "customer.admin@demo.local",
        "contact_phone": "1-800-555-0110 ext 101",
        "submitted_by_type": "Customer",
        "created_by_name": "Customer Portal",
        "assigned_to_name": "Platform Admin",
        "escalation_target": "",
        "summary": "Users reported a slow response while opening the Herra app this morning.",
        "case_details": (
            "Customer says several users experienced slow application loading and delayed response in the "
            "Herra interface during morning use."
        ),
        "general_notes": "",
        "internal_notes": "",
        "created_at": "2026-03-28T12:05:00+00:00",
        "updated_at": "2026-03-29T13:50:02+00:00",
    },
    3: {
        "id": 3,
        "case_number": 10002,
        "status": "Escalated",
        "priority": "Critical",
        "issue_type": "Connector Issue",
        "customer_id": 1,
        "customer_name": "Demo Customer",
        "contact_name": "Renee Foster",
        "contact_email": "rfoster@demo.local",
        "contact_phone": "1-800-555-0110 ext 133",
        "submitted_by_type": "Staff",
        "created_by_name": "Support Admin",
        "assigned_to_name": "Engineer Queue",
        "escalation_target": "Engineer",
        "summary": "Windows connector stopped checking in after server patching.",
        "case_details": (
            "Technician confirmed connector heartbeat stopped shortly after maintenance activity on the "
            "customer server."
        ),
        "general_notes": "",
        "internal_notes": "Escalated to engineering for deeper connector runtime review.",
        "created_at": "2026-03-27T18:25:00+00:00",
        "updated_at": "2026-03-28T08:10:00+00:00",
    },
    4: {
        "id": 4,
        "case_number": 10003,
        "status": "Customer Pending",
        "priority": "Low",
        "issue_type": "Herra Operation Issue",
        "customer_id": 3,
        "customer_name": "Red Canyon Logistics",
        "contact_name": "David Ortiz",
        "contact_email": "dortiz@redcanyonlogistics.local",
        "contact_phone": "1-800-555-0130 ext 309",
        "submitted_by_type": "Staff",
        "created_by_name": "Support Admin",
        "assigned_to_name": "Support Admin",
        "escalation_target": "",
        "summary": "Clarification needed on reported document visibility issue.",
        "case_details": "Customer mentioned missing documents but did not provide the affected source system.",
        "general_notes": "",
        "internal_notes": "Waiting for customer clarification before additional troubleshooting.",
        "created_at": "2026-03-25T15:35:00+00:00",
        "updated_at": "2026-03-28T09:45:00+00:00",
    },
}

DEV_PLATFORM_CASE_EVENTS: Dict[int, List[Dict[str, Any]]] = {}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.strip().split())


def _normalize_optional_string(value: Any) -> str:
    if value is None:
        return ""
    return _normalize_whitespace(str(value))


def _normalize_multiline_optional_string(value: Any) -> str:
    if value is None:
        return ""
    lines = [str(line).rstrip() for line in str(value).replace("\r\n", "\n").split("\n")]
    return "\n".join(lines).strip()


def _normalize_required_string(value: Any, label: str) -> str:
    normalized = _normalize_optional_string(value)
    if not normalized:
        raise bad_request_exception(f"{label} is required.")
    return normalized


def _get_customer_or_raise(customer_id: int) -> Dict[str, Any]:
    customer = DEV_CUSTOMER_ACCOUNTS.get(customer_id)
    if customer is None:
        raise not_found_exception("Customer account was not found.")
    return customer


def _build_platform_user_display_name(current_user: Dict[str, Any]) -> str:
    first_name = _normalize_optional_string(current_user.get("first_name"))
    last_name = _normalize_optional_string(current_user.get("last_name"))
    full_name = _normalize_whitespace(f"{first_name} {last_name}")
    return full_name or _normalize_optional_string(current_user.get("email")) or "Titan Staff"


def _current_user_role_names(current_user: Dict[str, Any]) -> set[str]:
    return {str(role_name) for role_name in current_user.get("role_names") or []}


def _ensure_case_accept_permission(current_user: Dict[str, Any]) -> None:
    if not _current_user_role_names(current_user).intersection(CASE_ACCEPT_ROLE_NAMES):
        raise forbidden_exception("You do not have permission to accept support cases.")


def _ensure_case_assign_permission(current_user: Dict[str, Any]) -> None:
    if not _current_user_role_names(current_user).intersection(CASE_ASSIGN_ROLE_NAMES):
        raise forbidden_exception("You do not have permission to assign support cases to other users.")


def _ensure_case_workflow_permission(case: Dict[str, Any], current_user: Dict[str, Any]) -> None:
    current_user_name = _build_platform_user_display_name(current_user)
    user_roles = _current_user_role_names(current_user)
    is_assigned_owner = _normalize_optional_string(case.get("assigned_to_name")) == current_user_name
    has_management_access = bool(user_roles.intersection(CASE_ASSIGN_ROLE_NAMES))

    if not is_assigned_owner and not has_management_access:
        raise forbidden_exception("You can only update workflow for your assigned cases.")


def _next_case_id() -> int:
    return max(DEV_PLATFORM_CASES.keys(), default=0) + 1


def _next_case_number() -> int:
    highest = CASE_NUMBER_START - 1
    for case in DEV_PLATFORM_CASES.values():
        highest = max(highest, int(case.get("case_number") or 0))
    return highest + 1


def _get_case_or_raise(case_id: int) -> Dict[str, Any]:
    case = DEV_PLATFORM_CASES.get(case_id)
    if case is None:
        raise not_found_exception("Case was not found.")
    return case


def _validate_case_status(value: str) -> str:
    normalized = _normalize_required_string(value, "Case status")
    if normalized not in CASE_STATUS_OPTIONS:
        raise bad_request_exception("A valid case status is required.")
    return normalized


def _validate_case_priority(value: str) -> str:
    normalized = _normalize_required_string(value, "Case priority")
    if normalized not in CASE_PRIORITY_OPTIONS:
        raise bad_request_exception("A valid case priority is required.")
    return normalized


def _validate_issue_type(value: str) -> str:
    normalized = _normalize_required_string(value, "Issue type")
    if normalized not in CASE_ISSUE_TYPE_OPTIONS:
        raise bad_request_exception("A valid issue type is required.")
    return normalized


def _validate_escalation_target(value: str) -> str:
    normalized = _normalize_optional_string(value)
    if normalized not in CASE_ESCALATION_TARGET_OPTIONS:
        raise bad_request_exception("A valid escalation target is required.")
    return normalized


def _validate_submitted_by_type(value: str) -> str:
    normalized = _normalize_required_string(value, "Submitted by type")
    if normalized not in CASE_SUBMITTED_BY_TYPE_OPTIONS:
        raise bad_request_exception("A valid submitted by type is required.")
    return normalized


def _case_sort_key(case: Dict[str, Any]) -> tuple[str, int]:
    updated_at = str(case.get("updated_at") or "")
    return (updated_at, int(case.get("case_number") or 0))


def _build_shared_case_number(case_number: Any) -> str:
    numeric_value = int(case_number or 0)
    return f"TC-{numeric_value}"


def _ensure_case_defaults(case: Dict[str, Any]) -> None:
    if "case_details" not in case:
        legacy_issue_details = _normalize_multiline_optional_string(case.get("issue_details"))
        legacy_testing_steps = _normalize_multiline_optional_string(case.get("testing_steps"))
        if legacy_issue_details and legacy_testing_steps:
            case["case_details"] = f"{legacy_issue_details}\n\n{legacy_testing_steps}"
        else:
            case["case_details"] = legacy_issue_details or legacy_testing_steps or ""
    if "general_notes" not in case:
        case["general_notes"] = ""
    if "internal_notes" not in case:
        case["internal_notes"] = ""
    if "customer_account_id" not in case:
        case["customer_account_id"] = int(case.get("customer_id") or 0)
    if "shared_case_number" not in case:
        case["shared_case_number"] = _build_shared_case_number(case.get("case_number"))
    if "support_subject" not in case:
        case["support_subject"] = _normalize_optional_string(case.get("summary"))


def _ensure_case_events_seeded() -> None:
    for case_id, case in DEV_PLATFORM_CASES.items():
        _ensure_case_defaults(case)
        if case_id in DEV_PLATFORM_CASE_EVENTS:
            for event in DEV_PLATFORM_CASE_EVENTS[case_id]:
                event.setdefault("source_label", "")
                event.setdefault("content", "")
                event.setdefault("is_customer_visible", event.get("event_type") != "internal_notes")
            continue

        created_at = str(case.get("created_at") or _utc_now_iso())
        updated_at = str(case.get("updated_at") or created_at)
        events: List[Dict[str, Any]] = [
            {
                "id": 1,
                "event_type": "created",
                "actor_name": str(case.get("created_by_name") or "System"),
                "message": f"Case created with status {case.get('status') or 'New'}.",
                "source_label": "",
                "content": "",
                "is_customer_visible": True,
                "created_at": created_at,
            }
        ]

        assigned_to_name = _normalize_optional_string(case.get("assigned_to_name"))
        if assigned_to_name:
            events.append(
                {
                    "id": 2,
                    "event_type": "assignment",
                    "actor_name": assigned_to_name,
                    "message": f"Case assigned to {assigned_to_name}.",
                    "source_label": "",
                    "content": "",
                    "is_customer_visible": True,
                    "created_at": updated_at,
                }
            )

        if _normalize_optional_string(case.get("escalation_target")):
            events.append(
                {
                    "id": len(events) + 1,
                    "event_type": "escalation",
                    "actor_name": str(case.get("created_by_name") or "System"),
                    "message": f"Case escalated to {case['escalation_target']}.",
                    "source_label": "",
                    "content": "",
                    "is_customer_visible": True,
                    "created_at": updated_at,
                }
            )

        DEV_PLATFORM_CASE_EVENTS[case_id] = events


def _record_case_event(
    case_id: int,
    event_type: str,
    actor_name: str,
    message: str,
    created_at: str | None = None,
    source_label: str = "",
    content: str = "",
    is_customer_visible: bool = True,
) -> None:
    _ensure_case_events_seeded()
    event_list = DEV_PLATFORM_CASE_EVENTS.setdefault(case_id, [])
    event_list.append(
        {
            "id": len(event_list) + 1,
            "event_type": event_type,
            "actor_name": actor_name,
            "message": message,
            "source_label": source_label,
            "content": content,
            "is_customer_visible": is_customer_visible,
            "created_at": created_at or _utc_now_iso(),
        }
    )


def _serialize_case_events(case_id: int) -> List[Dict[str, Any]]:
    _ensure_case_events_seeded()
    events = DEV_PLATFORM_CASE_EVENTS.get(case_id, [])
    return sorted(
        [
            {
                "id": int(item["id"]),
                "event_type": str(item["event_type"]),
                "actor_name": str(item["actor_name"]),
                "message": str(item["message"]),
                "source_label": str(item.get("source_label") or ""),
                "content": str(item.get("content") or ""),
                "is_customer_visible": bool(item.get("is_customer_visible", item.get("event_type") != "internal_notes")),
                "created_at": str(item["created_at"]),
            }
            for item in events
        ],
        key=lambda item: (item["created_at"], item["id"]),
        reverse=True,
    )


def _serialize_case_list_item(case: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_defaults(case)
    return {
        "id": case["id"],
        "case_number": int(case["case_number"]),
        "shared_case_number": str(case["shared_case_number"]),
        "customer_account_id": int(case["customer_account_id"]),
        "status": case["status"],
        "priority": case["priority"],
        "issue_type": case["issue_type"],
        "customer_id": int(case["customer_id"]),
        "customer_name": case["customer_name"],
        "contact_name": case["contact_name"],
        "assigned_to_name": case["assigned_to_name"],
        "submitted_by_type": case["submitted_by_type"],
        "escalation_target": case["escalation_target"],
        "summary": case["summary"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"],
    }


def _serialize_case_pickup_list_item(case: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_defaults(case)
    return {
        "id": case["id"],
        "case_number": int(case["case_number"]),
        "shared_case_number": str(case["shared_case_number"]),
        "customer_account_id": int(case["customer_account_id"]),
        "status": case["status"],
        "priority": case["priority"],
        "issue_type": case["issue_type"],
        "customer_id": int(case["customer_id"]),
        "customer_name": case["customer_name"],
        "contact_name": case["contact_name"],
        "submitted_by_type": case["submitted_by_type"],
        "escalation_target": case["escalation_target"],
        "summary": case["summary"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"],
    }


def _serialize_case_detail(case: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_defaults(case)
    return {
        "id": case["id"],
        "case_number": int(case["case_number"]),
        "shared_case_number": str(case["shared_case_number"]),
        "customer_account_id": int(case["customer_account_id"]),
        "status": case["status"],
        "priority": case["priority"],
        "issue_type": case["issue_type"],
        "customer_id": int(case["customer_id"]),
        "customer_name": case["customer_name"],
        "contact_name": case["contact_name"],
        "contact_email": case["contact_email"],
        "contact_phone": case["contact_phone"],
        "submitted_by_type": case["submitted_by_type"],
        "created_by_name": case["created_by_name"],
        "assigned_to_name": case["assigned_to_name"],
        "escalation_target": case["escalation_target"],
        "summary": case["summary"],
        "case_details": case["case_details"],
        "general_notes": case["general_notes"],
        "internal_notes": case["internal_notes"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"],
        "case_events": _serialize_case_events(int(case["id"])),
    }


def list_cases_needing_pickup() -> List[Dict[str, Any]]:
    _ensure_case_events_seeded()
    items = [
        _serialize_case_pickup_list_item(case)
        for case in DEV_PLATFORM_CASES.values()
        if not _normalize_optional_string(case.get("assigned_to_name"))
        and case.get("status") not in {"Resolved", "Closed"}
    ]
    return sorted(items, key=lambda item: (item["updated_at"], item["case_number"]), reverse=True)


def get_case_detail(case_id: int) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    case = _get_case_or_raise(case_id)
    return _serialize_case_detail(case)


def get_my_page_summary(current_user: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    my_name = _build_platform_user_display_name(current_user)

    my_cases = [
        case for case in DEV_PLATFORM_CASES.values() if _normalize_optional_string(case.get("assigned_to_name")) == my_name
    ]

    active_cases = [case for case in my_cases if case["status"] not in {"Resolved", "Closed"}]
    archived_source_cases = [case for case in my_cases if case["status"] in {"Resolved", "Closed"}]

    my_open_cases = [
        _serialize_case_list_item(case)
        for case in active_cases
        if case["status"] in {"Assigned", "In Progress", "Monitoring"}
    ]
    my_escalated_cases = [_serialize_case_list_item(case) for case in active_cases if case["status"] == "Escalated"]
    waiting_on_customer_cases = [
        _serialize_case_list_item(case) for case in active_cases if case["status"] == "Customer Pending"
    ]
    recently_updated_cases = [
        _serialize_case_list_item(case) for case in sorted(active_cases, key=_case_sort_key, reverse=True)[:10]
    ]
    archived_cases = [
        _serialize_case_list_item(case) for case in sorted(archived_source_cases, key=_case_sort_key, reverse=True)[:25]
    ]

    return {
        "my_open_cases": sorted(my_open_cases, key=lambda item: (item["updated_at"], item["case_number"]), reverse=True),
        "my_escalated_cases": sorted(
            my_escalated_cases, key=lambda item: (item["updated_at"], item["case_number"]), reverse=True
        ),
        "waiting_on_customer_cases": sorted(
            waiting_on_customer_cases, key=lambda item: (item["updated_at"], item["case_number"]), reverse=True
        ),
        "recently_updated_cases": recently_updated_cases,
        "archived_cases": archived_cases,
    }


def create_case(payload: Any, current_user: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    raw_payload = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)

    customer_id = int(raw_payload.get("customer_id") or 0)
    if customer_id <= 0:
        raise bad_request_exception("Customer is required.")

    customer = _get_customer_or_raise(customer_id)

    contact_name = _normalize_required_string(raw_payload.get("contact_name"), "Contact name")
    contact_email = _normalize_optional_string(raw_payload.get("contact_email"))
    contact_phone = _normalize_optional_string(raw_payload.get("contact_phone"))
    issue_type = _validate_issue_type(raw_payload.get("issue_type"))
    summary = _normalize_required_string(raw_payload.get("summary"), "Case summary")
    support_subject = _normalize_optional_string(raw_payload.get("support_subject")) or summary
    case_details = _normalize_multiline_optional_string(raw_payload.get("case_details"))
    if not case_details:
        raise bad_request_exception("Case details is required.")
    priority = _validate_case_priority(raw_payload.get("priority") or "Medium")
    escalation_target = _validate_escalation_target(raw_payload.get("escalation_target") or "")
    submitted_by_type = _validate_submitted_by_type(raw_payload.get("submitted_by_type") or "Staff")

    created_by_name = _build_platform_user_display_name(current_user)
    now_value = _utc_now_iso()
    next_case_id = _next_case_id()
    next_case_number = _next_case_number()

    assigned_to_name = created_by_name if submitted_by_type == "Staff" else ""
    initial_status = "In Progress" if submitted_by_type == "Staff" else "New"

    DEV_PLATFORM_CASES[next_case_id] = {
        "id": next_case_id,
        "case_number": next_case_number,
        "status": initial_status,
        "priority": priority,
        "issue_type": issue_type,
        "customer_id": customer_id,
        "customer_account_id": customer_id,
        "shared_case_number": _build_shared_case_number(next_case_number),
        "customer_name": customer["display_name"],
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "submitted_by_type": submitted_by_type,
        "created_by_name": created_by_name,
        "assigned_to_name": assigned_to_name,
        "escalation_target": escalation_target if initial_status == "Escalated" else "",
        "summary": summary,
        "support_subject": support_subject,
        "case_details": case_details,
        "general_notes": "",
        "internal_notes": "",
        "created_at": now_value,
        "updated_at": now_value,
    }

    _record_case_event(
        next_case_id,
        "created",
        created_by_name,
        f"Case created by {submitted_by_type.lower()} workflow with status {initial_status}.",
        created_at=now_value,
    )
    if assigned_to_name:
        _record_case_event(
            next_case_id,
            "assignment",
            created_by_name,
            f"Case assigned to {assigned_to_name}.",
            created_at=now_value,
        )

    return get_case_detail(next_case_id)


def accept_case(case_id: int, current_user: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    _ensure_case_accept_permission(current_user)
    case = _get_case_or_raise(case_id)

    if _normalize_optional_string(case.get("assigned_to_name")):
        raise bad_request_exception("This case is already assigned.")

    if case.get("status") in {"Resolved", "Closed"}:
        raise bad_request_exception("Resolved cases cannot be accepted.")

    assignee_name = _build_platform_user_display_name(current_user)
    case["assigned_to_name"] = assignee_name
    case["status"] = "In Progress"
    case["updated_at"] = _utc_now_iso()

    _record_case_event(case_id, "accepted", assignee_name, f"Case accepted by {assignee_name}.", created_at=case["updated_at"])
    _record_case_event(
        case_id,
        "status_change",
        assignee_name,
        "Status changed to In Progress.",
        created_at=case["updated_at"],
    )

    return {
        "message": "Case accepted successfully.",
        "case_id": int(case["id"]),
        "assigned_to_name": assignee_name,
    }


def assign_case(case_id: int, assigned_to_name: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    _ensure_case_assign_permission(current_user)
    case = _get_case_or_raise(case_id)
    actor_name = _build_platform_user_display_name(current_user)
    assignee_name = _normalize_required_string(assigned_to_name, "Assigned technician")
    previously_assigned_to = _normalize_optional_string(case.get("assigned_to_name"))

    if case.get("status") in {"Resolved", "Closed"}:
        raise bad_request_exception("Resolved cases cannot be reassigned.")

    case["assigned_to_name"] = assignee_name
    if case["status"] in {"New", "Assigned"} or not previously_assigned_to:
        case["status"] = "Assigned"
    case["updated_at"] = _utc_now_iso()

    if previously_assigned_to and previously_assigned_to != assignee_name:
        _record_case_event(
            case_id,
            "reassignment",
            actor_name,
            f"Case reassigned from {previously_assigned_to} to {assignee_name}.",
            created_at=case["updated_at"],
        )
    else:
        _record_case_event(
            case_id,
            "assignment",
            actor_name,
            f"Case assigned to {assignee_name}.",
            created_at=case["updated_at"],
        )

    return {
        "message": "Case assigned successfully.",
        "case_id": int(case["id"]),
        "assigned_to_name": assignee_name,
    }


def update_case_workflow(
    case_id: int,
    status: str,
    escalation_target: str,
    case_details: str,
    general_notes: str,
    internal_notes: str,
    current_user: Dict[str, Any],
) -> Dict[str, Any]:
    _ensure_case_events_seeded()
    case = _get_case_or_raise(case_id)
    _ensure_case_workflow_permission(case, current_user)

    actor_name = _build_platform_user_display_name(current_user)
    normalized_status = _validate_case_status(status)
    normalized_escalation_target = _validate_escalation_target(escalation_target)
    normalized_case_details = _normalize_multiline_optional_string(case_details)
    normalized_general_notes = _normalize_multiline_optional_string(general_notes)
    normalized_internal_notes = _normalize_multiline_optional_string(internal_notes)
    previous_status = str(case.get("status") or "")
    previous_escalation_target = _normalize_optional_string(case.get("escalation_target"))
    previous_assigned_to_name = _normalize_optional_string(case.get("assigned_to_name"))

    if case.get("status") in {"Resolved", "Closed"} and normalized_status != "Resolved":
        raise bad_request_exception("Resolved cases cannot be reopened in this phase.")

    if normalized_status == "Escalated" and not normalized_escalation_target:
        raise bad_request_exception("Escalation target is required when the case status is Escalated.")

    if not normalized_case_details:
        raise bad_request_exception("Case details is required.")

    case["status"] = normalized_status
    case["case_details"] = normalized_case_details
    case["updated_at"] = _utc_now_iso()

    if normalized_status == "Escalated":
        case["escalation_target"] = normalized_escalation_target
        case["assigned_to_name"] = f"{normalized_escalation_target} Queue"
    else:
        case["escalation_target"] = ""
        if previous_assigned_to_name.endswith(" Queue") and previous_assigned_to_name != actor_name:
            case["assigned_to_name"] = actor_name

    if previous_status != normalized_status:
        _record_case_event(
            case_id,
            "status_change",
            actor_name,
            f"Status changed from {previous_status} to {normalized_status}.",
            created_at=case["updated_at"],
        )

    if normalized_status == "Escalated" and previous_escalation_target != normalized_escalation_target:
        _record_case_event(
            case_id,
            "escalation",
            actor_name,
            f"Case escalated to {normalized_escalation_target}.",
            created_at=case["updated_at"],
        )

    if previous_assigned_to_name != _normalize_optional_string(case.get("assigned_to_name")):
        _record_case_event(
            case_id,
            "assignment",
            actor_name,
            f"Case assignment moved to {case['assigned_to_name']}.",
            created_at=case["updated_at"],
        )

    if normalized_general_notes:
        _record_case_event(
            case_id,
            "general_notes",
            actor_name,
            "",
            created_at=case["updated_at"],
            source_label="General Notes",
            content=normalized_general_notes,
            is_customer_visible=True,
        )

    if normalized_internal_notes:
        _record_case_event(
            case_id,
            "internal_notes",
            actor_name,
            "",
            created_at=case["updated_at"],
            source_label="Internal Notes",
            content=normalized_internal_notes,
            is_customer_visible=False,
        )

    case["general_notes"] = ""
    case["internal_notes"] = ""

    if normalized_status != "Escalated" and previous_escalation_target and not case["escalation_target"]:
        _record_case_event(
            case_id,
            "escalation_cleared",
            actor_name,
            f"Escalation cleared from {previous_escalation_target}.",
            created_at=case["updated_at"],
        )

    return _serialize_case_detail(case)


def list_customer_contacts_for_case_form(customer_id: int) -> List[Dict[str, str]]:
    _get_customer_or_raise(customer_id)

    return [
        {
            "contact_name": str(contact.get("full_name") or ""),
            "contact_email": str(contact.get("email") or ""),
            "contact_phone": _normalize_whitespace(
                f"{str(contact.get('main_phone') or '')} {('ext ' + str(contact.get('extension'))) if contact.get('extension') else ''}"
            ).strip(),
        }
        for contact in DEV_CUSTOMER_CONTACTS.get(customer_id, [])
    ]