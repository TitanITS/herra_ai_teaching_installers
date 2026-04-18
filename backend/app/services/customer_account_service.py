from typing import Any, Dict, List

from pydantic import BaseModel

from app.core.exceptions import bad_request_exception, not_found_exception
from app.services.customer_auth_service import DEV_CUSTOMER_INVITES

CUSTOMER_BASE_ACCOUNT_START = 10000

DEV_CUSTOMER_ACCOUNTS: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "customer_number": "10000-1",
        "base_account_number": 10000,
        "term_number": 1,
        "slug": "demo-customer",
        "legal_name": "Demo Customer Holdings LLC",
        "display_name": "Demo Customer",
        "authorized_purchasing_contact": "Primary Admin",
        "address": "100 Titan Plaza",
        "city": "Raleigh",
        "state": "NC",
        "zip_code": "27601",
        "country": "United States",
        "main_phone": "1-800-555-0110",
        "extension": "101",
        "cell_phone": "1-919-555-0119",
        "website": "https://demo-customer.example.com",
        "industry": "Technology",
        "company_size": "51-200",
        "notes": "Original pilot customer used to validate Titan staff workflows and customer-facing Herra access.",
        "contract_start_date": "2026-01-05",
        "renewal_date": "2027-01-05",
        "billing_status": "Current",
        "customer_status": "Active Support",
        "account_manager_name": "Jordan Ellis",
        "sales_consultant_name": "Avery Cole",
        "implementation_engineer_name": "Marcus Hale",
        "timezone": "America/New_York",
    },
    2: {
        "id": 2,
        "customer_number": "10001-1",
        "base_account_number": 10001,
        "term_number": 1,
        "slug": "northwind-health-group",
        "legal_name": "Northwind Health Group, Inc.",
        "display_name": "Northwind Health Group",
        "authorized_purchasing_contact": "Melissa Grant",
        "address": "250 Clinical Way",
        "city": "Chicago",
        "state": "IL",
        "zip_code": "60601",
        "country": "United States",
        "main_phone": "1-800-555-0120",
        "extension": "204",
        "cell_phone": "1-312-555-0188",
        "website": "https://northwindhealth.example.com",
        "industry": "Healthcare",
        "company_size": "201-500",
        "notes": "Healthcare onboarding account for connector planning, compliance review, and staged deployment tracking.",
        "contract_start_date": "2026-03-01",
        "renewal_date": "2027-03-01",
        "billing_status": "Pending",
        "customer_status": "Implementation",
        "account_manager_name": "Jordan Ellis",
        "sales_consultant_name": "Naomi Reed",
        "implementation_engineer_name": "Marcus Hale",
        "timezone": "America/Chicago",
    },
    3: {
        "id": 3,
        "customer_number": "10002-1",
        "base_account_number": 10002,
        "term_number": 1,
        "slug": "red-canyon-logistics",
        "legal_name": "Red Canyon Logistics Group, LLC",
        "display_name": "Red Canyon Logistics",
        "authorized_purchasing_contact": "David Ortiz",
        "address": "820 Freight Line Road",
        "city": "Denver",
        "state": "CO",
        "zip_code": "80202",
        "country": "United States",
        "main_phone": "1-800-555-0130",
        "extension": "309",
        "cell_phone": "1-720-555-0144",
        "website": "https://redcanyonlogistics.example.com",
        "industry": "Logistics",
        "company_size": "51-200",
        "notes": "Sales-qualified logistics prospect awaiting final approval on Herra deployment and connector package selection.",
        "contract_start_date": "2026-04-15",
        "renewal_date": "2027-04-15",
        "billing_status": "Trial",
        "customer_status": "Quoted",
        "account_manager_name": "Jordan Ellis",
        "sales_consultant_name": "Avery Cole",
        "implementation_engineer_name": "Pending Assignment",
        "timezone": "America/Denver",
    },
}

DEV_CUSTOMER_CONTACTS: Dict[int, List[Dict[str, str]]] = {
    1: [
        {
            "contact_source": "Sales Entered",
            "full_name": "Primary Admin",
            "title": "Chief Operations Officer",
            "email": "customer.admin@demo.local",
            "main_phone": "1-800-555-0110",
            "extension": "101",
            "cell_phone": "1-919-555-0101",
            "permission_role": "Administrator",
            "decision_priority": "Primary Decision Maker",
        },
        {
            "contact_source": "Sales Entered",
            "full_name": "Taylor Brooks",
            "title": "Billing Manager",
            "email": "billing@demo.local",
            "main_phone": "1-800-555-0110",
            "extension": "120",
            "cell_phone": "",
            "permission_role": "Billing",
            "decision_priority": "Billing Contact",
        },
        {
            "contact_source": "Customer Portal Submitted",
            "full_name": "Renee Foster",
            "title": "IT Director",
            "email": "rfoster@demo.local",
            "main_phone": "1-800-555-0110",
            "extension": "133",
            "cell_phone": "1-919-555-0147",
            "permission_role": "Technical",
            "decision_priority": "Technical Contact",
        },
    ],
    2: [
        {
            "contact_source": "Sales Entered",
            "full_name": "Melissa Grant",
            "title": "Director of Operations",
            "email": "melissa.grant@northwindhealth.local",
            "main_phone": "1-800-555-0120",
            "extension": "204",
            "cell_phone": "1-312-555-0140",
            "permission_role": "Administrator",
            "decision_priority": "Primary Decision Maker",
        },
        {
            "contact_source": "Sales Entered",
            "full_name": "Andre Hale",
            "title": "IT Systems Lead",
            "email": "andre.hale@northwindhealth.local",
            "main_phone": "1-800-555-0120",
            "extension": "222",
            "cell_phone": "",
            "permission_role": "Technical",
            "decision_priority": "Implementation Contact",
        },
        {
            "contact_source": "Sales Entered",
            "full_name": "Priya Morgan",
            "title": "Controller",
            "email": "finance@northwindhealth.local",
            "main_phone": "1-800-555-0120",
            "extension": "230",
            "cell_phone": "",
            "permission_role": "Billing",
            "decision_priority": "Billing Contact",
        },
    ],
    3: [
        {
            "contact_source": "Sales Entered",
            "full_name": "David Ortiz",
            "title": "Operations Manager",
            "email": "dortiz@redcanyonlogistics.local",
            "main_phone": "1-800-555-0130",
            "extension": "309",
            "cell_phone": "1-720-555-0175",
            "permission_role": "Executive",
            "decision_priority": "Primary Decision Maker",
        },
        {
            "contact_source": "Sales Entered",
            "full_name": "Erica Snow",
            "title": "Controller",
            "email": "finance@redcanyonlogistics.local",
            "main_phone": "1-800-555-0130",
            "extension": "317",
            "cell_phone": "",
            "permission_role": "Billing",
            "decision_priority": "Billing Contact",
        },
    ],
}

DEV_CUSTOMER_ASSIGNMENTS: Dict[int, Dict[str, Dict[str, str]]] = {
    1: {
        "account_manager": {
            "role": "Account Manager",
            "name": "Jordan Ellis",
            "email": "jordan.ellis@titan.local",
            "phone": "1-800-555-0100",
        },
        "sales_consultant": {
            "role": "Sales Consultant",
            "name": "Avery Cole",
            "email": "avery.cole@titan.local",
            "phone": "1-800-555-0105",
        },
        "implementation_engineer": {
            "role": "Implementation Engineer",
            "name": "Marcus Hale",
            "email": "marcus.hale@titan.local",
            "phone": "1-800-555-0116",
        },
    },
    2: {
        "account_manager": {
            "role": "Account Manager",
            "name": "Jordan Ellis",
            "email": "jordan.ellis@titan.local",
            "phone": "1-800-555-0100",
        },
        "sales_consultant": {
            "role": "Sales Consultant",
            "name": "Naomi Reed",
            "email": "naomi.reed@titan.local",
            "phone": "1-800-555-0114",
        },
        "implementation_engineer": {
            "role": "Implementation Engineer",
            "name": "Marcus Hale",
            "email": "marcus.hale@titan.local",
            "phone": "1-800-555-0116",
        },
    },
    3: {
        "account_manager": {
            "role": "Account Manager",
            "name": "Jordan Ellis",
            "email": "jordan.ellis@titan.local",
            "phone": "1-800-555-0100",
        },
        "sales_consultant": {
            "role": "Sales Consultant",
            "name": "Avery Cole",
            "email": "avery.cole@titan.local",
            "phone": "1-800-555-0105",
        },
        "implementation_engineer": {
            "role": "Implementation Engineer",
            "name": "Pending Assignment",
            "email": "implementation.queue@titan.local",
            "phone": "1-800-555-0199",
        },
    },
}

DEV_CUSTOMER_DEPLOYMENTS: Dict[int, List[Dict[str, str]]] = {
    1: [
        {
            "license_id": "HER-CLD-1001",
            "service_name": "Herra Cloud SaaS",
            "status": "active",
        },
        {
            "license_id": "CON-WIN-2101",
            "service_name": "Secure Network Connector - Windows",
            "status": "active",
        },
    ],
    2: [
        {
            "license_id": "HER-CLD-1044",
            "service_name": "Herra Cloud SaaS",
            "status": "implementation",
        },
        {
            "license_id": "CON-SP-1045",
            "service_name": "SharePoint Secure Network Connector",
            "status": "planned",
        },
    ],
    3: [
        {
            "license_id": "DISC-3301",
            "service_name": "Herra Discovery Package",
            "status": "quoted",
        }
    ],
}

DEV_CUSTOMER_CONNECTORS: Dict[int, List[Dict[str, str]]] = {
    1: [
        {
            "license_id": "CON-WIN-2101",
            "connector_name": "Windows Connector",
            "status": "healthy",
        },
        {
            "license_id": "CON-M365-2102",
            "connector_name": "Microsoft 365 Connector",
            "status": "healthy",
        },
    ],
    2: [
        {
            "license_id": "CON-SP-1045",
            "connector_name": "SharePoint Connector",
            "status": "planned",
        }
    ],
    3: [],
}

DEV_CUSTOMER_SUPPORT_SUMMARIES: Dict[int, Dict[str, Any]] = {
    1: {
        "tier_name": "Priority",
        "response_target": "Within 4 business hours",
        "coverage_hours": "Monday-Friday, 8 AM to 6 PM customer local time",
        "included_channels": ["Email", "Phone", "Portal"],
        "escalation_level": "Priority operations queue",
        "notes": "Includes accelerated escalation for production-impacting connector or deployment issues.",
    },
    2: {
        "tier_name": "Standard",
        "response_target": "Next business day",
        "coverage_hours": "Monday-Friday, 8 AM to 5 PM customer local time",
        "included_channels": ["Email", "Portal"],
        "escalation_level": "Standard support queue",
        "notes": "Implementation-related issues may be routed directly to the assigned implementation engineer.",
    },
    3: {
        "tier_name": "Pre-Sale Evaluation",
        "response_target": "Sales follow-up within 1 business day",
        "coverage_hours": "Business hours only",
        "included_channels": ["Email", "Phone"],
        "escalation_level": "Sales and solution engineering",
        "notes": "Used during quote and contract review before full implementation begins.",
    },
}

DEV_NOTIFICATION_SUMMARIES: List[Dict[str, Any]] = [
    {
        "id": 1,
        "title": "Titan Notice",
        "message": "All Titan services are operational.",
        "severity": "info",
        "is_active": True,
    },
    {
        "id": 2,
        "title": "Billing Reminder",
        "message": "Your next billing cycle closes at month end.",
        "severity": "warning",
        "is_active": True,
    },
]

DEV_ACCOUNT_MANAGER: Dict[str, Any] = {
    "name": "Jordan Ellis",
    "title": "Account Manager",
    "email": "jordan.ellis@titan.local",
    "phone": "1-800-555-0100",
}


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
    return slug or "customer"


def _notes_summary(value: str) -> str:
    clean_value = _normalize_whitespace(value)
    if len(clean_value) <= 96:
        return clean_value
    return f"{clean_value[:93]}..."


def _format_customer_number(base_account_number: int, term_number: int) -> str:
    return f"{int(base_account_number)}-{int(term_number)}"


def _get_base_account_number(account: Dict[str, Any]) -> int:
    value = account.get("base_account_number")
    if isinstance(value, int) and value >= CUSTOMER_BASE_ACCOUNT_START:
        return value

    fallback = CUSTOMER_BASE_ACCOUNT_START + max(int(account.get("id", 1)) - 1, 0)
    account["base_account_number"] = fallback
    return fallback


def _get_term_number(account: Dict[str, Any]) -> int:
    value = account.get("term_number")
    if isinstance(value, int) and value >= 1:
        return value

    account["term_number"] = 1
    return 1


def _ensure_customer_number_fields(account: Dict[str, Any]) -> None:
    base_account_number = _get_base_account_number(account)
    term_number = _get_term_number(account)
    account["customer_number"] = _format_customer_number(base_account_number, term_number)


def _next_base_account_number() -> int:
    highest = CUSTOMER_BASE_ACCOUNT_START - 1
    for account in DEV_CUSTOMER_ACCOUNTS.values():
        highest = max(highest, _get_base_account_number(account))
    return highest + 1


def _get_customer_or_raise(customer_id: int) -> Dict[str, Any]:
    account = DEV_CUSTOMER_ACCOUNTS.get(customer_id)
    if account is None:
        raise not_found_exception("Customer account was not found.")
    _ensure_customer_number_fields(account)
    return account


def _get_primary_contact(customer_id: int) -> Dict[str, str]:
    contacts = DEV_CUSTOMER_CONTACTS.get(customer_id, [])
    for contact in contacts:
        if contact["decision_priority"] == "Primary Decision Maker":
            return contact
    return contacts[0] if contacts else {
        "full_name": "",
        "email": "",
    }


def _serialize_platform_customer_list_item(account: Dict[str, Any]) -> Dict[str, Any]:
    customer_id = account["id"]
    primary_contact = _get_primary_contact(customer_id)
    deployments = DEV_CUSTOMER_DEPLOYMENTS.get(customer_id, [])
    connectors = DEV_CUSTOMER_CONNECTORS.get(customer_id, [])
    support_summary = DEV_CUSTOMER_SUPPORT_SUMMARIES.get(customer_id, {})
    assignments = DEV_CUSTOMER_ASSIGNMENTS.get(customer_id, {})
    account_manager = assignments.get("account_manager", {})

    _ensure_customer_number_fields(account)

    return {
        "id": customer_id,
        "customer_number": account["customer_number"],
        "base_account_number": account["base_account_number"],
        "term_number": account["term_number"],
        "display_name": account["display_name"],
        "legal_name": account["legal_name"],
        "customer_status": account["customer_status"],
        "billing_status": account["billing_status"],
        "primary_contact_name": primary_contact.get("full_name", ""),
        "primary_contact_email": primary_contact.get("email", ""),
        "account_manager_name": account_manager.get("name", ""),
        "support_tier_name": support_summary.get("tier_name", "Standard"),
        "deployment_count": len(deployments),
        "connector_count": len(connectors),
        "notes_summary": _notes_summary(account.get("notes", "")),
    }


def _serialize_platform_customer_detail(account: Dict[str, Any]) -> Dict[str, Any]:
    customer_id = account["id"]
    assignments = DEV_CUSTOMER_ASSIGNMENTS.get(customer_id, {})
    support_summary = DEV_CUSTOMER_SUPPORT_SUMMARIES.get(customer_id, {
        "tier_name": "Standard",
        "response_target": "Next business day",
        "coverage_hours": "Business hours",
        "included_channels": ["Email"],
        "escalation_level": "Standard support queue",
        "notes": "",
    })

    _ensure_customer_number_fields(account)

    return {
        "id": customer_id,
        "customer_number": account["customer_number"],
        "base_account_number": account["base_account_number"],
        "term_number": account["term_number"],
        "slug": account["slug"],
        "company_details": {
            "legal_name": account["legal_name"],
            "display_name": account["display_name"],
            "authorized_purchasing_contact": account["authorized_purchasing_contact"],
            "address": account["address"],
            "city": account["city"],
            "state": account["state"],
            "zip_code": account["zip_code"],
            "country": account["country"],
            "main_phone": account["main_phone"],
            "extension": account["extension"],
            "cell_phone": account["cell_phone"],
            "website": account["website"],
            "industry": account["industry"],
            "company_size": account["company_size"],
            "notes": account.get("notes", ""),
            "contract_start_date": account["contract_start_date"],
            "renewal_date": account["renewal_date"],
        },
        "billing_status": account["billing_status"],
        "customer_status": account["customer_status"],
        "account_manager": assignments.get(
            "account_manager",
            {"role": "Account Manager", "name": "", "email": "", "phone": ""},
        ),
        "sales_consultant": assignments.get(
            "sales_consultant",
            {"role": "Sales Consultant", "name": "", "email": "", "phone": ""},
        ),
        "implementation_engineer": assignments.get(
            "implementation_engineer",
            {"role": "Implementation Engineer", "name": "", "email": "", "phone": ""},
        ),
        "contacts": [contact.copy() for contact in DEV_CUSTOMER_CONTACTS.get(customer_id, [])],
        "deployments": [deployment.copy() for deployment in DEV_CUSTOMER_DEPLOYMENTS.get(customer_id, [])],
        "connectors": [connector.copy() for connector in DEV_CUSTOMER_CONNECTORS.get(customer_id, [])],
        "support_summary": {
            "tier_name": support_summary["tier_name"],
            "response_target": support_summary["response_target"],
            "coverage_hours": support_summary["coverage_hours"],
            "included_channels": list(support_summary["included_channels"]),
            "escalation_level": support_summary["escalation_level"],
            "notes": support_summary["notes"],
        },
    }


class _PlatformCustomerCreatePayload(BaseModel):
    legal_name: str
    display_name: str
    slug: str = ""
    authorized_purchasing_contact: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    main_phone: str
    extension: str
    cell_phone: str = ""
    website: str
    industry: str
    company_size: str
    notes: str = ""
    contract_start_date: str
    renewal_date: str = ""
    billing_status: str
    customer_status: str
    account_manager_name: str
    sales_consultant_name: str
    implementation_engineer_name: str
    contacts: List[Dict[str, Any]]


def get_customer_account_summary(current_user: Dict[str, Any]) -> Dict[str, Any]:
    account = DEV_CUSTOMER_ACCOUNTS.get(current_user["customer_account_id"])
    if account is None:
        raise not_found_exception("Customer account was not found.")

    primary_contact = _get_primary_contact(account["id"])

    _ensure_customer_number_fields(account)

    return {
        "id": account["id"],
        "customer_number": account["customer_number"],
        "base_account_number": account["base_account_number"],
        "term_number": account["term_number"],
        "name": account["display_name"],
        "display_name": account["display_name"],
        "legal_name": account["legal_name"],
        "slug": account["slug"],
        "primary_contact_name": primary_contact.get("full_name", ""),
        "primary_contact_email": primary_contact.get("email", ""),
        "billing_email": next(
            (
                contact["email"]
                for contact in DEV_CUSTOMER_CONTACTS.get(account["id"], [])
                if contact["permission_role"] == "Billing"
            ),
            primary_contact.get("email", ""),
        ),
        "status": account["customer_status"],
        "timezone": account.get("timezone", "America/New_York"),
        "billing_status": account["billing_status"],
        "contract_start_date": account["contract_start_date"],
        "renewal_date": account["renewal_date"],
    }


def get_customer_account_manager(current_user: Dict[str, Any]) -> Dict[str, Any]:
    _ = current_user
    return DEV_ACCOUNT_MANAGER.copy()


def get_customer_notifications(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    _ = current_user
    return [notification.copy() for notification in DEV_NOTIFICATION_SUMMARIES]


def get_customer_dashboard_summary(current_user: Dict[str, Any]) -> Dict[str, Any]:
    tokens_purchased = 100000
    tokens_used = 18320

    return {
        "customer_account": get_customer_account_summary(current_user),
        "notifications": get_customer_notifications(current_user),
        "tokens_purchased": tokens_purchased,
        "tokens_used": tokens_used,
        "tokens_remaining": tokens_purchased - tokens_used,
        "monthly_billing_estimate": 249.99,
        "deployment_status": "active",
        "deployment_version": "Herra v1.0.0",
        "connector_count": 4,
        "connector_healthy_count": 3,
        "account_manager": get_customer_account_manager(current_user),
    }


def list_platform_customers() -> List[Dict[str, Any]]:
    customers = [_serialize_platform_customer_list_item(account) for account in DEV_CUSTOMER_ACCOUNTS.values()]
    return sorted(customers, key=lambda item: item["display_name"].lower())


def create_platform_customer(payload: Any) -> Dict[str, Any]:
    raw_payload = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)
    parsed_payload = _PlatformCustomerCreatePayload(**raw_payload)

    legal_name = _normalize_whitespace(parsed_payload.legal_name)
    display_name = _normalize_whitespace(parsed_payload.display_name)
    authorized_purchasing_contact = _normalize_whitespace(parsed_payload.authorized_purchasing_contact)
    address = _normalize_whitespace(parsed_payload.address)
    city = _normalize_whitespace(parsed_payload.city)
    state = _normalize_whitespace(parsed_payload.state)
    zip_code = _normalize_whitespace(parsed_payload.zip_code)
    country = _normalize_whitespace(parsed_payload.country)
    main_phone = _normalize_whitespace(parsed_payload.main_phone)
    extension = _normalize_whitespace(parsed_payload.extension)
    cell_phone = _normalize_whitespace(parsed_payload.cell_phone)
    website = _normalize_whitespace(parsed_payload.website)
    industry = _normalize_whitespace(parsed_payload.industry)
    company_size = _normalize_whitespace(parsed_payload.company_size)
    notes = parsed_payload.notes.strip()
    contract_start_date = _normalize_whitespace(parsed_payload.contract_start_date)
    renewal_date = _normalize_whitespace(parsed_payload.renewal_date)
    billing_status = _normalize_whitespace(parsed_payload.billing_status)
    customer_status = _normalize_whitespace(parsed_payload.customer_status)
    account_manager_name = _normalize_whitespace(parsed_payload.account_manager_name)
    sales_consultant_name = _normalize_whitespace(parsed_payload.sales_consultant_name)
    implementation_engineer_name = _normalize_whitespace(parsed_payload.implementation_engineer_name)

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
        ("Contract start date", contract_start_date),
        ("Billing status", billing_status),
        ("Customer status", customer_status),
        ("Account manager", account_manager_name),
        ("Sales consultant", sales_consultant_name),
        ("Implementation engineer", implementation_engineer_name),
    ]

    for label, value in required_fields:
        if not value:
            raise bad_request_exception(f"{label} is required.")

    if not parsed_payload.contacts:
        raise bad_request_exception("At least one customer contact is required.")

    normalized_contacts: List[Dict[str, str]] = []
    for contact in parsed_payload.contacts:
        full_name = _normalize_whitespace(str(contact.get("full_name", "")))
        title = _normalize_whitespace(str(contact.get("title", "")))
        email = str(contact.get("email", "")).strip().lower()
        contact_main_phone = _normalize_whitespace(str(contact.get("main_phone", "")))
        contact_extension = _normalize_whitespace(str(contact.get("extension", "")))
        contact_cell_phone = _normalize_whitespace(str(contact.get("cell_phone", "")))
        permission_role = _normalize_whitespace(str(contact.get("permission_role", "")))
        decision_priority = _normalize_whitespace(str(contact.get("decision_priority", "")))
        contact_source = _normalize_whitespace(str(contact.get("contact_source", "")))

        contact_required_fields = [
            ("Contact full name", full_name),
            ("Contact title", title),
            ("Contact email", email),
            ("Contact main phone", contact_main_phone),
            ("Contact extension", contact_extension),
            ("Contact role / permission", permission_role),
            ("Contact decision priority", decision_priority),
        ]

        for label, value in contact_required_fields:
            if not value:
                raise bad_request_exception(f"{label} is required for every saved contact.")

        normalized_contacts.append(
            {
                "contact_source": contact_source or "Sales Entered",
                "full_name": full_name,
                "title": title,
                "email": email,
                "main_phone": contact_main_phone,
                "extension": contact_extension,
                "cell_phone": contact_cell_phone,
                "permission_role": permission_role,
                "decision_priority": decision_priority,
            }
        )

    slug_source = parsed_payload.slug if parsed_payload.slug.strip() else display_name
    slug = _slugify(slug_source)

    existing_slugs = {account["slug"].lower() for account in DEV_CUSTOMER_ACCOUNTS.values()}
    if slug.lower() in existing_slugs:
        raise bad_request_exception("A customer with that slug already exists.")

    next_customer_id = max(DEV_CUSTOMER_ACCOUNTS.keys(), default=0) + 1
    next_base_account_number = _next_base_account_number()

    DEV_CUSTOMER_ACCOUNTS[next_customer_id] = {
        "id": next_customer_id,
        "customer_number": _format_customer_number(next_base_account_number, 1),
        "base_account_number": next_base_account_number,
        "term_number": 1,
        "slug": slug,
        "legal_name": legal_name,
        "display_name": display_name,
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
        "notes": notes,
        "contract_start_date": contract_start_date,
        "renewal_date": renewal_date,
        "billing_status": billing_status,
        "customer_status": customer_status,
        "account_manager_name": account_manager_name,
        "sales_consultant_name": sales_consultant_name,
        "implementation_engineer_name": implementation_engineer_name,
        "timezone": "America/New_York",
    }

    DEV_CUSTOMER_CONTACTS[next_customer_id] = normalized_contacts

    DEV_CUSTOMER_ASSIGNMENTS[next_customer_id] = {
        "account_manager": {
            "role": "Account Manager",
            "name": account_manager_name,
            "email": f"{_slugify(account_manager_name)}@titan.local",
            "phone": "1-800-555-0100",
        },
        "sales_consultant": {
            "role": "Sales Consultant",
            "name": sales_consultant_name,
            "email": f"{_slugify(sales_consultant_name)}@titan.local",
            "phone": "1-800-555-0105",
        },
        "implementation_engineer": {
            "role": "Implementation Engineer",
            "name": implementation_engineer_name,
            "email": f"{_slugify(implementation_engineer_name)}@titan.local",
            "phone": "1-800-555-0116",
        },
    }

    DEV_CUSTOMER_DEPLOYMENTS[next_customer_id] = []
    DEV_CUSTOMER_CONNECTORS[next_customer_id] = []
    DEV_CUSTOMER_SUPPORT_SUMMARIES[next_customer_id] = {
        "tier_name": "Standard",
        "response_target": "Next business day",
        "coverage_hours": "Monday-Friday, 8 AM to 5 PM customer local time",
        "included_channels": ["Email", "Portal"],
        "escalation_level": "Standard support queue",
        "notes": "Default support tier assigned until billing or contract-specific support changes are applied.",
    }

    return get_platform_customer_detail(next_customer_id)


def get_platform_customer_detail(customer_id: int) -> Dict[str, Any]:
    account = _get_customer_or_raise(customer_id)
    return _serialize_platform_customer_detail(account)


def get_platform_customer_assignments(customer_id: int) -> List[Dict[str, str]]:
    _ = _get_customer_or_raise(customer_id)
    assignments = DEV_CUSTOMER_ASSIGNMENTS.get(customer_id, {})

    return [
        assignments.get("account_manager", {}).copy(),
        assignments.get("sales_consultant", {}).copy(),
        assignments.get("implementation_engineer", {}).copy(),
    ]


def send_platform_customer_invite(
    customer_id: int,
    email: str,
    first_name: str,
    last_name: str,
    role_names: List[str],
) -> Dict[str, Any]:
    account = _get_customer_or_raise(customer_id)

    email = email.lower().strip()

    for invite in DEV_CUSTOMER_INVITES.values():
        if invite["email"].lower() == email and not invite["is_used"]:
            raise bad_request_exception("An active invite already exists for that email.")

    invite_token = f"platform-invite-{customer_id}-{email.replace('@', '-at-').replace('.', '-')}"
    DEV_CUSTOMER_INVITES[invite_token] = {
        "token": invite_token,
        "email": email,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "role_names": role_names,
        "customer_account_id": customer_id,
        "customer_account_name": account["display_name"],
        "is_valid": True,
        "is_used": False,
        "expires_at": "2099-12-31T23:59:59+00:00",
    }

    return {
        "message": "Customer invite sent successfully.",
        "invite_token": invite_token,
        "invited_email": email,
    }


def resend_platform_customer_invite(customer_id: int, email: str) -> Dict[str, str]:
    _ = _get_customer_or_raise(customer_id)
    email = email.lower().strip()

    for invite in DEV_CUSTOMER_INVITES.values():
        if (
            invite["customer_account_id"] == customer_id
            and invite["email"].lower() == email
            and not invite["is_used"]
        ):
            return {"message": "Customer invite resent successfully."}

    raise not_found_exception("Active customer invite was not found.")


def revoke_platform_customer_invite(customer_id: int, email: str) -> Dict[str, str]:
    _ = _get_customer_or_raise(customer_id)
    email = email.lower().strip()

    for invite in DEV_CUSTOMER_INVITES.values():
        if (
            invite["customer_account_id"] == customer_id
            and invite["email"].lower() == email
            and not invite["is_used"]
        ):
            invite["is_valid"] = False
            invite["is_used"] = True
            return {"message": "Customer invite revoked successfully."}

    raise not_found_exception("Active customer invite was not found.")