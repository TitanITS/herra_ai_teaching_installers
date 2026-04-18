from typing import Any, Dict, List

from app.core.exceptions import bad_request_exception, not_found_exception
from app.services.customer_account_service import (
    DEV_CUSTOMER_ACCOUNTS,
    DEV_CUSTOMER_CONNECTORS,
    DEV_CUSTOMER_CONTACTS,
    DEV_CUSTOMER_DEPLOYMENTS,
    create_platform_customer,
)


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.strip().split())


def _slugify(value: str) -> str:
    normalized = _normalize_whitespace(value).lower()
    slug_chars: List[str] = []
    previous_was_dash = False

    for char in normalized:
        if char.isalnum():
            slug_chars.append(char)
            previous_was_dash = False
            continue

        if not previous_was_dash:
            slug_chars.append("-")
            previous_was_dash = True

    slug = "".join(slug_chars).strip("-")
    return slug or "sales-opportunity"


SALES_STAGE_OPTIONS = {
    "Lead",
    "Contacted",
    "Qualified",
    "Discovery",
    "Quoted",
    "Negotiation",
    "Contract Submitted",
    "Contract Signed",
    "Closed Won",
    "Closed Lost",
    "Handoff Complete",
}

QUOTE_STATUS_OPTIONS = {
    "Not Started",
    "Draft",
    "Sent",
    "Revised",
    "Accepted",
    "Declined",
}

CONTRACT_STATUS_OPTIONS = {
    "Not Started",
    "Draft",
    "Submitted",
    "Under Review",
    "Signed",
    "Declined",
}

CONTACT_PERMISSION_OPTIONS = {
    "Administrator",
    "Billing",
    "Technical",
    "Operations",
    "Security",
    "Executive",
    "General Contact",
}

DECISION_PRIORITY_OPTIONS = {
    "Primary Decision Maker",
    "Secondary Decision Maker",
    "Billing Contact",
    "Technical Contact",
    "Implementation Contact",
    "General Contact",
}

SERVICE_STATUS_OPTIONS = {
    "Proposed",
    "Quoted",
    "Approved",
}

SERVICE_BILLING_CYCLE_OPTIONS = {
    "Monthly",
    "Annual",
    "One-Time",
}


def _auto_customer_ready(opportunity: Dict[str, Any]) -> bool:
    return (
        opportunity.get("contract_status") == "Signed"
        and bool(opportunity.get("payment_confirmed"))
        and bool(opportunity.get("account_manager_intro_complete"))
        and bool(opportunity.get("ready_for_implementation"))
    )


def _format_customer_number_preview(base_account_number: int, term_number: int) -> str:
    return f"{int(base_account_number)}-{int(term_number)}"


def _get_opportunity_kind(opportunity: Dict[str, Any]) -> str:
    return str(opportunity.get("opportunity_kind") or "New Sale")


def _get_renewal_of_customer_id(opportunity: Dict[str, Any]) -> int | None:
    value = opportunity.get("renewal_of_customer_id")
    return int(value) if isinstance(value, int) else None


def _get_renewal_term_number(opportunity: Dict[str, Any]) -> int | None:
    value = opportunity.get("renewal_term_number")
    return int(value) if isinstance(value, int) else None


def _get_customer_number_preview(opportunity: Dict[str, Any]) -> str:
    preview = str(opportunity.get("customer_number_preview") or "").strip()
    if preview:
        return preview

    renewal_of_customer_id = _get_renewal_of_customer_id(opportunity)
    renewal_term_number = _get_renewal_term_number(opportunity)

    if renewal_of_customer_id is not None and renewal_term_number is not None:
        customer = DEV_CUSTOMER_ACCOUNTS.get(renewal_of_customer_id)
        if customer is not None:
            base_account_number = int(customer.get("base_account_number") or 10000)
            preview = _format_customer_number_preview(base_account_number, renewal_term_number)
            opportunity["customer_number_preview"] = preview
            return preview

    handoff_customer_id = opportunity.get("handoff_customer_id")
    if isinstance(handoff_customer_id, int):
        customer = DEV_CUSTOMER_ACCOUNTS.get(handoff_customer_id)
        if customer is not None:
            preview = str(customer.get("customer_number") or "").strip()
            if preview:
                opportunity["customer_number_preview"] = preview
                return preview

    return ""


def _build_next_renewal_term_number(customer_id: int) -> int:
    customer = DEV_CUSTOMER_ACCOUNTS.get(customer_id)
    if customer is None:
        raise not_found_exception("Customer account was not found.")

    base_account_number = int(customer.get("base_account_number") or 10000)
    highest_term = int(customer.get("term_number") or 1)

    for account in DEV_CUSTOMER_ACCOUNTS.values():
        if int(account.get("base_account_number") or 0) == base_account_number:
            highest_term = max(highest_term, int(account.get("term_number") or 1))

    for opportunity in DEV_SALES_OPPORTUNITIES.values():
        if int(opportunity.get("renewal_of_customer_id") or 0) == customer_id:
            highest_term = max(highest_term, int(opportunity.get("renewal_term_number") or 0))

    return highest_term + 1


DEV_SALES_OPPORTUNITIES: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "legal_name": "Blue Peak Logistics Group LLC",
        "display_name": "Blue Peak Logistics",
        "slug": "blue-peak-logistics",
        "authorized_purchasing_contact": "Andrea Mills",
        "address": "410 Trade Route Avenue",
        "city": "Charlotte",
        "state": "NC",
        "zip_code": "28202",
        "country": "United States",
        "main_phone": "1-800-555-0201",
        "extension": "101",
        "cell_phone": "1-704-555-0101",
        "website": "https://bluepeaklogistics.example.com",
        "industry": "Logistics",
        "company_size": "201-500",
        "sales_consultant_name": "Avery Cole",
        "account_manager_name": "Jordan Ellis",
        "implementation_engineer_name": "Marcus Hale",
        "sales_stage": "Qualified",
        "quote_status": "Sent",
        "contract_status": "Draft",
        "timezone": "America/New_York",
        "expected_close_date": "2026-04-18",
        "desired_go_live_date": "2026-05-01",
        "estimated_monthly_value_display": "$1,250 / month",
        "proposed_connector_count": 3,
        "proposed_license_count": 85,
        "payment_confirmed": False,
        "account_manager_intro_complete": False,
        "ready_for_implementation": False,
        "notes": "Strong logistics prospect. Wants Herra Cloud SaaS plus three Secure Network Connectors after internal review.",
        "handoff_customer_id": None,
    },
    2: {
        "id": 2,
        "legal_name": "Summit Family Dental, PLLC",
        "display_name": "Summit Family Dental",
        "slug": "summit-family-dental",
        "authorized_purchasing_contact": "Dr. Holly Rhodes",
        "address": "85 Smiles Parkway",
        "city": "Chicago",
        "state": "IL",
        "zip_code": "60603",
        "country": "United States",
        "main_phone": "1-800-555-0211",
        "extension": "220",
        "cell_phone": "",
        "website": "https://summitdental.example.com",
        "industry": "Healthcare",
        "company_size": "11-50",
        "sales_consultant_name": "Naomi Reed",
        "account_manager_name": "Jordan Ellis",
        "implementation_engineer_name": "Marcus Hale",
        "sales_stage": "Contract Submitted",
        "quote_status": "Accepted",
        "contract_status": "Under Review",
        "timezone": "America/Chicago",
        "expected_close_date": "2026-04-10",
        "desired_go_live_date": "2026-05-15",
        "estimated_monthly_value_display": "$899 / month",
        "proposed_connector_count": 1,
        "proposed_license_count": 24,
        "payment_confirmed": False,
        "account_manager_intro_complete": False,
        "ready_for_implementation": False,
        "notes": "Healthcare-focused opportunity with phased onboarding. Waiting on signed paperwork and final billing approval.",
        "handoff_customer_id": None,
    },
    3: {
        "id": 3,
        "legal_name": "North River Fabrication Group, Inc.",
        "display_name": "North River Fabrication",
        "slug": "north-river-fabrication",
        "authorized_purchasing_contact": "Marcus Lee",
        "address": "2900 Foundry Drive",
        "city": "Denver",
        "state": "CO",
        "zip_code": "80205",
        "country": "United States",
        "main_phone": "1-800-555-0221",
        "extension": "309",
        "cell_phone": "1-720-555-0170",
        "website": "https://northriverfab.example.com",
        "industry": "Manufacturing",
        "company_size": "51-200",
        "sales_consultant_name": "Avery Cole",
        "account_manager_name": "Jordan Ellis",
        "implementation_engineer_name": "Pending Assignment",
        "sales_stage": "Lead",
        "quote_status": "Not Started",
        "contract_status": "Not Started",
        "timezone": "America/Denver",
        "expected_close_date": "",
        "desired_go_live_date": "",
        "estimated_monthly_value_display": "$0 - discovery",
        "proposed_connector_count": 2,
        "proposed_license_count": 40,
        "payment_confirmed": False,
        "account_manager_intro_complete": False,
        "ready_for_implementation": False,
        "notes": "Early-stage manufacturing lead. Needs discovery call and customer-side infrastructure review.",
        "handoff_customer_id": None,
    },
}

DEV_SALES_CONTACTS: Dict[int, List[Dict[str, str]]] = {
    1: [
        {
            "full_name": "Andrea Mills",
            "title": "VP of Operations",
            "email": "andrea.mills@bluepeak.local",
            "main_phone": "1-800-555-0201",
            "extension": "101",
            "cell_phone": "1-704-555-0101",
            "recommended_permission_role": "Administrator",
            "decision_priority": "Primary Decision Maker",
        },
        {
            "full_name": "Sam Patel",
            "title": "Controller",
            "email": "billing@bluepeak.local",
            "main_phone": "1-800-555-0201",
            "extension": "119",
            "cell_phone": "",
            "recommended_permission_role": "Billing",
            "decision_priority": "Billing Contact",
        },
    ],
    2: [
        {
            "full_name": "Dr. Holly Rhodes",
            "title": "Practice Owner",
            "email": "holly.rhodes@summitdental.local",
            "main_phone": "1-800-555-0211",
            "extension": "220",
            "cell_phone": "",
            "recommended_permission_role": "Executive",
            "decision_priority": "Primary Decision Maker",
        },
        {
            "full_name": "Evan Price",
            "title": "Practice IT Coordinator",
            "email": "evan.price@summitdental.local",
            "main_phone": "1-800-555-0211",
            "extension": "228",
            "cell_phone": "",
            "recommended_permission_role": "Technical",
            "decision_priority": "Technical Contact",
        },
    ],
    3: [
        {
            "full_name": "Marcus Lee",
            "title": "Plant Manager",
            "email": "marcus.lee@northriverfab.local",
            "main_phone": "1-800-555-0221",
            "extension": "309",
            "cell_phone": "1-720-555-0170",
            "recommended_permission_role": "Executive",
            "decision_priority": "Primary Decision Maker",
        }
    ],
}

DEV_SALES_SERVICES: Dict[int, List[Dict[str, str]]] = {
    1: [
        {
            "service_name": "Herra Cloud SaaS",
            "service_type": "SaaS Subscription",
            "status": "Quoted",
            "billing_cycle": "Monthly",
            "price_display": "$899 / month",
        },
        {
            "service_name": "Secure Network Connector Bundle",
            "service_type": "Connector Package",
            "status": "Quoted",
            "billing_cycle": "Monthly",
            "price_display": "$351 / month",
        },
    ],
    2: [
        {
            "service_name": "Herra Cloud SaaS",
            "service_type": "SaaS Subscription",
            "status": "Approved",
            "billing_cycle": "Monthly",
            "price_display": "$699 / month",
        },
        {
            "service_name": "Implementation Onboarding Package",
            "service_type": "Professional Services",
            "status": "Approved",
            "billing_cycle": "One-Time",
            "price_display": "$1,500 one-time",
        },
    ],
    3: [
        {
            "service_name": "Discovery and Scope Package",
            "service_type": "Professional Services",
            "status": "Proposed",
            "billing_cycle": "One-Time",
            "price_display": "$750 one-time",
        }
    ],
}


def _get_sales_opportunity_or_raise(opportunity_id: int) -> Dict[str, Any]:
    opportunity = DEV_SALES_OPPORTUNITIES.get(opportunity_id)
    if opportunity is None:
        raise not_found_exception("Sales opportunity was not found.")
    return opportunity


def _serialize_sales_list_item(opportunity: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": opportunity["id"],
        "opportunity_kind": _get_opportunity_kind(opportunity),
        "renewal_of_customer_id": _get_renewal_of_customer_id(opportunity),
        "renewal_term_number": _get_renewal_term_number(opportunity),
        "customer_number_preview": _get_customer_number_preview(opportunity),
        "legal_name": opportunity["legal_name"],
        "display_name": opportunity["display_name"],
        "slug": opportunity["slug"],
        "authorized_purchasing_contact": opportunity["authorized_purchasing_contact"],
        "sales_stage": opportunity["sales_stage"],
        "quote_status": opportunity["quote_status"],
        "contract_status": opportunity["contract_status"],
        "sales_consultant_name": opportunity["sales_consultant_name"],
        "estimated_monthly_value_display": opportunity["estimated_monthly_value_display"],
        "expected_close_date": opportunity["expected_close_date"],
        "proposed_service_count": len(DEV_SALES_SERVICES.get(opportunity["id"], [])),
        "handoff_customer_id": opportunity.get("handoff_customer_id"),
        "payment_confirmed": bool(opportunity.get("payment_confirmed")),
        "account_manager_intro_complete": bool(opportunity.get("account_manager_intro_complete")),
        "ready_for_implementation": bool(opportunity.get("ready_for_implementation")),
        "auto_customer_ready": _auto_customer_ready(opportunity),
    }


def _serialize_sales_detail(opportunity: Dict[str, Any]) -> Dict[str, Any]:
    opportunity_id = opportunity["id"]

    return {
        "id": opportunity_id,
        "opportunity_kind": _get_opportunity_kind(opportunity),
        "renewal_of_customer_id": _get_renewal_of_customer_id(opportunity),
        "renewal_term_number": _get_renewal_term_number(opportunity),
        "customer_number_preview": _get_customer_number_preview(opportunity),
        "legal_name": opportunity["legal_name"],
        "display_name": opportunity["display_name"],
        "slug": opportunity["slug"],
        "authorized_purchasing_contact": opportunity["authorized_purchasing_contact"],
        "address": opportunity["address"],
        "city": opportunity["city"],
        "state": opportunity["state"],
        "zip_code": opportunity["zip_code"],
        "country": opportunity["country"],
        "main_phone": opportunity["main_phone"],
        "extension": opportunity["extension"],
        "cell_phone": opportunity["cell_phone"],
        "website": opportunity["website"],
        "industry": opportunity["industry"],
        "company_size": opportunity["company_size"],
        "sales_consultant_name": opportunity["sales_consultant_name"],
        "account_manager_name": opportunity["account_manager_name"],
        "implementation_engineer_name": opportunity["implementation_engineer_name"],
        "sales_stage": opportunity["sales_stage"],
        "quote_status": opportunity["quote_status"],
        "contract_status": opportunity["contract_status"],
        "timezone": opportunity["timezone"],
        "expected_close_date": opportunity["expected_close_date"],
        "desired_go_live_date": opportunity["desired_go_live_date"],
        "estimated_monthly_value_display": opportunity["estimated_monthly_value_display"],
        "proposed_connector_count": opportunity["proposed_connector_count"],
        "proposed_license_count": opportunity["proposed_license_count"],
        "payment_confirmed": bool(opportunity.get("payment_confirmed")),
        "account_manager_intro_complete": bool(opportunity.get("account_manager_intro_complete")),
        "ready_for_implementation": bool(opportunity.get("ready_for_implementation")),
        "auto_customer_ready": _auto_customer_ready(opportunity),
        "notes": opportunity.get("notes", ""),
        "handoff_customer_id": opportunity.get("handoff_customer_id"),
        "contacts": [contact.copy() for contact in DEV_SALES_CONTACTS.get(opportunity_id, [])],
        "services": [service.copy() for service in DEV_SALES_SERVICES.get(opportunity_id, [])],
    }


def _auto_convert_opportunity_if_ready(opportunity_id: int) -> None:
    opportunity = _get_sales_opportunity_or_raise(opportunity_id)

    if opportunity.get("handoff_customer_id") is not None:
        return

    if _get_renewal_of_customer_id(opportunity) is not None:
        return

    if not _auto_customer_ready(opportunity):
        return

    contacts = DEV_SALES_CONTACTS.get(opportunity_id, [])
    services = DEV_SALES_SERVICES.get(opportunity_id, [])

    customer_payload = {
        "legal_name": opportunity["legal_name"],
        "display_name": opportunity["display_name"],
        "slug": opportunity["slug"],
        "authorized_purchasing_contact": opportunity["authorized_purchasing_contact"],
        "address": opportunity["address"],
        "city": opportunity["city"],
        "state": opportunity["state"],
        "zip_code": opportunity["zip_code"],
        "country": opportunity["country"],
        "main_phone": opportunity["main_phone"],
        "extension": opportunity["extension"],
        "cell_phone": opportunity["cell_phone"],
        "website": opportunity["website"],
        "industry": opportunity["industry"],
        "company_size": opportunity["company_size"],
        "notes": (
            f"Created automatically from Sales opportunity #{opportunity_id}.\n\n"
            f"Payment confirmed: Yes.\n"
            f"Account manager introduction complete: Yes.\n"
            f"Ready for implementation: Yes.\n"
            f"Expected close date: {opportunity['expected_close_date'] or 'Not provided'}.\n"
            f"Desired go-live date: {opportunity['desired_go_live_date'] or 'Not provided'}.\n"
            f"Estimated value: {opportunity['estimated_monthly_value_display']}.\n\n"
            f"{opportunity.get('notes', '')}"
        ).strip(),
        "contract_start_date": opportunity["desired_go_live_date"] or opportunity["expected_close_date"] or "",
        "renewal_date": "",
        "billing_status": "Current",
        "customer_status": "Implementation",
        "account_manager_name": opportunity["account_manager_name"],
        "sales_consultant_name": opportunity["sales_consultant_name"],
        "implementation_engineer_name": opportunity["implementation_engineer_name"],
        "contacts": [
            {
                "contact_source": "Sales Entered",
                "full_name": contact["full_name"],
                "title": contact["title"],
                "email": contact["email"],
                "main_phone": contact["main_phone"],
                "extension": contact["extension"],
                "cell_phone": contact["cell_phone"],
                "permission_role": contact["recommended_permission_role"],
                "decision_priority": contact["decision_priority"],
            }
            for contact in contacts
        ],
    }

    created_customer = create_platform_customer(customer_payload)
    customer_id = created_customer["id"]

    DEV_CUSTOMER_DEPLOYMENTS[customer_id] = [
        {
            "license_id": f"SALE-DEP-{opportunity_id:04d}-{index + 1:02d}",
            "service_name": service["service_name"],
            "status": "implementation",
        }
        for index, service in enumerate(services)
    ]

    connector_count = int(opportunity.get("proposed_connector_count", 0) or 0)
    DEV_CUSTOMER_CONNECTORS[customer_id] = [
        {
            "license_id": f"SALE-CON-{opportunity_id:04d}-{index + 1:02d}",
            "connector_name": f"Secure Network Connector {index + 1}",
            "status": "planned",
        }
        for index in range(connector_count)
    ]

    opportunity["handoff_customer_id"] = customer_id
    opportunity["sales_stage"] = "Handoff Complete"
    opportunity["customer_number_preview"] = str(created_customer.get("customer_number") or "")


def list_platform_sales_opportunities() -> List[Dict[str, Any]]:
    for opportunity_id in list(DEV_SALES_OPPORTUNITIES.keys()):
        _auto_convert_opportunity_if_ready(opportunity_id)

    opportunities = [_serialize_sales_list_item(item) for item in DEV_SALES_OPPORTUNITIES.values()]
    return sorted(opportunities, key=lambda item: item["display_name"].lower())


def get_platform_sales_opportunity_detail(opportunity_id: int) -> Dict[str, Any]:
    _auto_convert_opportunity_if_ready(opportunity_id)
    opportunity = _get_sales_opportunity_or_raise(opportunity_id)
    return _serialize_sales_detail(opportunity)


def create_platform_sales_opportunity(payload: Any) -> Dict[str, Any]:
    raw_payload = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)

    legal_name = _normalize_whitespace(str(raw_payload.get("legal_name", "")))
    display_name = _normalize_whitespace(str(raw_payload.get("display_name", "")))
    authorized_purchasing_contact = _normalize_whitespace(str(raw_payload.get("authorized_purchasing_contact", "")))
    address = _normalize_whitespace(str(raw_payload.get("address", "")))
    city = _normalize_whitespace(str(raw_payload.get("city", "")))
    state = _normalize_whitespace(str(raw_payload.get("state", "")))
    zip_code = _normalize_whitespace(str(raw_payload.get("zip_code", "")))
    country = _normalize_whitespace(str(raw_payload.get("country", "")))
    main_phone = _normalize_whitespace(str(raw_payload.get("main_phone", "")))
    extension = _normalize_whitespace(str(raw_payload.get("extension", "")))
    cell_phone = _normalize_whitespace(str(raw_payload.get("cell_phone", "")))
    website = _normalize_whitespace(str(raw_payload.get("website", "")))
    industry = _normalize_whitespace(str(raw_payload.get("industry", "")))
    company_size = _normalize_whitespace(str(raw_payload.get("company_size", "")))
    sales_consultant_name = _normalize_whitespace(str(raw_payload.get("sales_consultant_name", "")))
    account_manager_name = _normalize_whitespace(str(raw_payload.get("account_manager_name", "")))
    implementation_engineer_name = _normalize_whitespace(str(raw_payload.get("implementation_engineer_name", "")))
    sales_stage = _normalize_whitespace(str(raw_payload.get("sales_stage", "")))
    quote_status = _normalize_whitespace(str(raw_payload.get("quote_status", "")))
    contract_status = _normalize_whitespace(str(raw_payload.get("contract_status", "")))
    timezone = _normalize_whitespace(str(raw_payload.get("timezone", "")))
    expected_close_date = _normalize_whitespace(str(raw_payload.get("expected_close_date", "")))
    desired_go_live_date = _normalize_whitespace(str(raw_payload.get("desired_go_live_date", "")))
    estimated_monthly_value_display = _normalize_whitespace(str(raw_payload.get("estimated_monthly_value_display", "")))
    proposed_connector_count = int(raw_payload.get("proposed_connector_count", 0) or 0)
    proposed_license_count = int(raw_payload.get("proposed_license_count", 0) or 0)
    payment_confirmed = bool(raw_payload.get("payment_confirmed", False))
    account_manager_intro_complete = bool(raw_payload.get("account_manager_intro_complete", False))
    ready_for_implementation = bool(raw_payload.get("ready_for_implementation", False))
    notes = str(raw_payload.get("notes", "")).strip()
    contacts = raw_payload.get("contacts", [])
    services = raw_payload.get("services", [])

    required_fields = [
        ("Company legal name", legal_name),
        ("Display name", display_name),
        ("Authorized purchasing contact", authorized_purchasing_contact),
        ("Address", address),
        ("City", city),
        ("State", state),
        ("ZIP code", zip_code),
        ("Country", country),
        ("Main phone", main_phone),
        ("Extension", extension),
        ("Website", website),
        ("Industry", industry),
        ("Company size", company_size),
        ("Sales consultant", sales_consultant_name),
        ("Account manager", account_manager_name),
        ("Implementation engineer", implementation_engineer_name),
        ("Sales stage", sales_stage),
        ("Quote status", quote_status),
        ("Contract status", contract_status),
        ("Timezone", timezone),
        ("Estimated monthly value", estimated_monthly_value_display),
    ]

    for label, value in required_fields:
        if not value:
            raise bad_request_exception(f"{label} is required.")

    if sales_stage not in SALES_STAGE_OPTIONS:
        raise bad_request_exception("A valid sales stage is required.")

    if quote_status not in QUOTE_STATUS_OPTIONS:
        raise bad_request_exception("A valid quote status is required.")

    if contract_status not in CONTRACT_STATUS_OPTIONS:
        raise bad_request_exception("A valid contract status is required.")

    if proposed_connector_count < 0:
        raise bad_request_exception("Proposed connector count cannot be negative.")

    if proposed_license_count < 0:
        raise bad_request_exception("Proposed license count cannot be negative.")

    if not isinstance(contacts, list) or len(contacts) == 0:
        raise bad_request_exception("At least one contact is required.")

    if not isinstance(services, list) or len(services) == 0:
        raise bad_request_exception("At least one proposed service is required.")

    normalized_contacts: List[Dict[str, str]] = []
    for contact in contacts:
        full_name = _normalize_whitespace(str(contact.get("full_name", "")))
        title = _normalize_whitespace(str(contact.get("title", "")))
        email = _normalize_whitespace(str(contact.get("email", ""))).lower()
        contact_main_phone = _normalize_whitespace(str(contact.get("main_phone", "")))
        contact_extension = _normalize_whitespace(str(contact.get("extension", "")))
        contact_cell_phone = _normalize_whitespace(str(contact.get("cell_phone", "")))
        recommended_permission_role = _normalize_whitespace(str(contact.get("recommended_permission_role", "")))
        decision_priority = _normalize_whitespace(str(contact.get("decision_priority", "")))

        contact_required_fields = [
            ("Contact full name", full_name),
            ("Contact title", title),
            ("Contact email", email),
            ("Contact main phone", contact_main_phone),
            ("Contact extension", contact_extension),
            ("Recommended permission role", recommended_permission_role),
            ("Decision priority", decision_priority),
        ]

        for label, value in contact_required_fields:
            if not value:
                raise bad_request_exception(f"{label} is required for every saved contact.")

        if recommended_permission_role not in CONTACT_PERMISSION_OPTIONS:
            raise bad_request_exception("A valid contact permission role is required.")

        if decision_priority not in DECISION_PRIORITY_OPTIONS:
            raise bad_request_exception("A valid decision priority is required.")

        normalized_contacts.append(
            {
                "full_name": full_name,
                "title": title,
                "email": email,
                "main_phone": contact_main_phone,
                "extension": contact_extension,
                "cell_phone": contact_cell_phone,
                "recommended_permission_role": recommended_permission_role,
                "decision_priority": decision_priority,
            }
        )

    normalized_services: List[Dict[str, str]] = []
    for service in services:
        service_name = _normalize_whitespace(str(service.get("service_name", "")))
        service_type = _normalize_whitespace(str(service.get("service_type", "")))
        status = _normalize_whitespace(str(service.get("status", "")))
        billing_cycle = _normalize_whitespace(str(service.get("billing_cycle", "")))
        price_display = _normalize_whitespace(str(service.get("price_display", "")))

        service_required_fields = [
            ("Service name", service_name),
            ("Service type", service_type),
            ("Service status", status),
            ("Service billing cycle", billing_cycle),
            ("Service price", price_display),
        ]

        for label, value in service_required_fields:
            if not value:
                raise bad_request_exception(f"{label} is required for every proposed service.")

        if status not in SERVICE_STATUS_OPTIONS:
            raise bad_request_exception("A valid service status is required.")

        if billing_cycle not in SERVICE_BILLING_CYCLE_OPTIONS:
            raise bad_request_exception("A valid service billing cycle is required.")

        normalized_services.append(
            {
                "service_name": service_name,
                "service_type": service_type,
                "status": status,
                "billing_cycle": billing_cycle,
                "price_display": price_display,
            }
        )

    slug_value = _normalize_whitespace(str(raw_payload.get("slug", "")))
    slug = _slugify(slug_value or display_name)

    existing_slugs = {item["slug"].lower() for item in DEV_SALES_OPPORTUNITIES.values()}
    if slug.lower() in existing_slugs:
        raise bad_request_exception("A sales opportunity with that slug already exists.")

    next_opportunity_id = max(DEV_SALES_OPPORTUNITIES.keys(), default=0) + 1

    DEV_SALES_OPPORTUNITIES[next_opportunity_id] = {
        "id": next_opportunity_id,
        "legal_name": legal_name,
        "display_name": display_name,
        "slug": slug,
        "authorized_purchasing_contact": authorized_purchasing_contact,
        "address": address,
        "city": city,
        "state": state,
        "zip_code": zip_code,
        "country": country,
        "main_phone": main_phone,
        "extension": extension,
        "cell_phone": cell_phone,
        "website": website,
        "industry": industry,
        "company_size": company_size,
        "sales_consultant_name": sales_consultant_name,
        "account_manager_name": account_manager_name,
        "implementation_engineer_name": implementation_engineer_name,
        "sales_stage": sales_stage,
        "quote_status": quote_status,
        "contract_status": contract_status,
        "timezone": timezone,
        "expected_close_date": expected_close_date,
        "desired_go_live_date": desired_go_live_date,
        "estimated_monthly_value_display": estimated_monthly_value_display,
        "proposed_connector_count": proposed_connector_count,
        "proposed_license_count": proposed_license_count,
        "payment_confirmed": payment_confirmed,
        "account_manager_intro_complete": account_manager_intro_complete,
        "ready_for_implementation": ready_for_implementation,
        "notes": notes,
        "handoff_customer_id": None,
        "opportunity_kind": "New Sale",
        "renewal_of_customer_id": None,
        "renewal_term_number": None,
        "customer_number_preview": "",
    }

    DEV_SALES_CONTACTS[next_opportunity_id] = normalized_contacts
    DEV_SALES_SERVICES[next_opportunity_id] = normalized_services

    _auto_convert_opportunity_if_ready(next_opportunity_id)
    return get_platform_sales_opportunity_detail(next_opportunity_id)


def create_platform_sales_renewal_from_customer(customer_id: int) -> Dict[str, Any]:
    customer = DEV_CUSTOMER_ACCOUNTS.get(customer_id)
    if customer is None:
        raise not_found_exception("Customer account was not found.")

    next_term_number = _build_next_renewal_term_number(customer_id)
    base_account_number = int(customer.get("base_account_number") or 10000)
    customer_number_preview = _format_customer_number_preview(base_account_number, next_term_number)

    existing_open_renewal = next(
        (
            opportunity
            for opportunity in DEV_SALES_OPPORTUNITIES.values()
            if int(opportunity.get("renewal_of_customer_id") or 0) == customer_id
            and int(opportunity.get("renewal_term_number") or 0) == next_term_number
            and opportunity.get("handoff_customer_id") is None
        ),
        None,
    )
    if existing_open_renewal is not None:
        return get_platform_sales_opportunity_detail(int(existing_open_renewal["id"]))

    next_opportunity_id = max(DEV_SALES_OPPORTUNITIES.keys(), default=0) + 1
    display_name = str(customer.get("display_name") or customer.get("legal_name") or "Customer")
    slug_base = _slugify(f"{customer.get('slug') or display_name}-renewal-{next_term_number}")
    existing_slugs = {item["slug"].lower() for item in DEV_SALES_OPPORTUNITIES.values()}
    slug = slug_base
    suffix = 2
    while slug.lower() in existing_slugs:
        slug = f"{slug_base}-{suffix}"
        suffix += 1

    desired_go_live_date = str(customer.get("renewal_date") or "")
    notes = (
        f"Renewal opportunity created from existing customer account {customer.get('customer_number', customer_number_preview)}.\n\n"
        f"Permanent base account number remains {base_account_number}.\n"
        f"Next term sequence prepared: {next_term_number}."
    )

    DEV_SALES_OPPORTUNITIES[next_opportunity_id] = {
        "id": next_opportunity_id,
        "legal_name": str(customer.get("legal_name") or ""),
        "display_name": display_name,
        "slug": slug,
        "authorized_purchasing_contact": str(customer.get("authorized_purchasing_contact") or ""),
        "address": str(customer.get("address") or ""),
        "city": str(customer.get("city") or ""),
        "state": str(customer.get("state") or ""),
        "zip_code": str(customer.get("zip_code") or ""),
        "country": str(customer.get("country") or ""),
        "main_phone": str(customer.get("main_phone") or ""),
        "extension": str(customer.get("extension") or ""),
        "cell_phone": str(customer.get("cell_phone") or ""),
        "website": str(customer.get("website") or ""),
        "industry": str(customer.get("industry") or ""),
        "company_size": str(customer.get("company_size") or ""),
        "sales_consultant_name": str(customer.get("sales_consultant_name") or ""),
        "account_manager_name": str(customer.get("account_manager_name") or ""),
        "implementation_engineer_name": str(customer.get("implementation_engineer_name") or ""),
        "sales_stage": "Qualified",
        "quote_status": "Draft",
        "contract_status": "Not Started",
        "timezone": str(customer.get("timezone") or "America/New_York"),
        "expected_close_date": desired_go_live_date,
        "desired_go_live_date": desired_go_live_date,
        "estimated_monthly_value_display": "Renewal - pricing review required",
        "proposed_connector_count": len(DEV_CUSTOMER_CONNECTORS.get(customer_id, [])),
        "proposed_license_count": len(DEV_CUSTOMER_DEPLOYMENTS.get(customer_id, [])),
        "payment_confirmed": False,
        "account_manager_intro_complete": False,
        "ready_for_implementation": False,
        "notes": notes,
        "handoff_customer_id": None,
        "opportunity_kind": "Renewal",
        "renewal_of_customer_id": customer_id,
        "renewal_term_number": next_term_number,
        "customer_number_preview": customer_number_preview,
    }

    DEV_SALES_CONTACTS[next_opportunity_id] = [
        {
            "full_name": str(contact.get("full_name") or ""),
            "title": str(contact.get("title") or ""),
            "email": str(contact.get("email") or ""),
            "main_phone": str(contact.get("main_phone") or ""),
            "extension": str(contact.get("extension") or ""),
            "cell_phone": str(contact.get("cell_phone") or ""),
            "recommended_permission_role": str(contact.get("permission_role") or "General Contact"),
            "decision_priority": str(contact.get("decision_priority") or "General Contact"),
        }
        for contact in DEV_CUSTOMER_CONTACTS.get(customer_id, [])
    ] or [
        {
            "full_name": str(customer.get("authorized_purchasing_contact") or ""),
            "title": "Primary Contact",
            "email": "",
            "main_phone": str(customer.get("main_phone") or ""),
            "extension": str(customer.get("extension") or ""),
            "cell_phone": str(customer.get("cell_phone") or ""),
            "recommended_permission_role": "General Contact",
            "decision_priority": "Primary Decision Maker",
        }
    ]

    DEV_SALES_SERVICES[next_opportunity_id] = [
        {
            "service_name": deployment.get("service_name", "Renewal Service"),
            "service_type": "Renewal",
            "status": "Proposed",
            "billing_cycle": "Annual",
            "price_display": "Pending renewal quote",
        }
        for deployment in DEV_CUSTOMER_DEPLOYMENTS.get(customer_id, [])
    ] or [
        {
            "service_name": "Renewal Term",
            "service_type": "Renewal",
            "status": "Proposed",
            "billing_cycle": "Annual",
            "price_display": "Pending renewal quote",
        }
    ]

    return get_platform_sales_opportunity_detail(next_opportunity_id)