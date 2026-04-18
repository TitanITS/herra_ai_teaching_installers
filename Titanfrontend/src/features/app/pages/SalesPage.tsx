import { useEffect, useMemo, useState } from "react";
import {
    createPlatformSalesOpportunity,
    getPlatformSalesOpportunityDetail,
    getPlatformSalesOpportunities,
} from "../../../api/sales";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { useAuth } from "../../../hooks/auth/useAuth";
import type {
    PlatformSalesCreateContactInput,
    PlatformSalesCreateOpportunityInput,
    PlatformSalesCreateServiceInput,
    PlatformSalesOpportunityDetail,
    PlatformSalesOpportunityListItem,
} from "../../../types/sales";

type SalesFormState = PlatformSalesCreateOpportunityInput;

const SALES_STAGE_OPTIONS = [
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
];

const QUOTE_STATUS_OPTIONS = [
    "Not Started",
    "Draft",
    "Sent",
    "Revised",
    "Accepted",
    "Declined",
];

const CONTRACT_STATUS_OPTIONS = [
    "Not Started",
    "Draft",
    "Submitted",
    "Under Review",
    "Signed",
    "Declined",
];

const CONTACT_PERMISSION_OPTIONS = [
    "Administrator",
    "Billing",
    "Technical",
    "Operations",
    "Security",
    "Executive",
    "General Contact",
];

const DECISION_PRIORITY_OPTIONS = [
    "Primary Decision Maker",
    "Secondary Decision Maker",
    "Billing Contact",
    "Technical Contact",
    "Implementation Contact",
    "General Contact",
];

const SERVICE_STATUS_OPTIONS = ["Proposed", "Quoted", "Approved"];
const SERVICE_TYPE_OPTIONS = [
    "SaaS Subscription",
    "Connector Package",
    "Professional Services",
    "Implementation",
    "Support",
    "Custom",
];
const BILLING_CYCLE_OPTIONS = ["Monthly", "Annual", "One-Time"];

function buildSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function renderCustomerConversionLabel(row: {
    handoff_customer_id: number | null;
    auto_customer_ready: boolean;
    customer_number_preview: string;
}) {
    if (row.handoff_customer_id) {
        return row.customer_number_preview || `Customer #${row.handoff_customer_id}`;
    }

    if (row.auto_customer_ready) {
        return row.customer_number_preview ? `Auto-ready -> ${row.customer_number_preview}` : "Auto-ready";
    }

    return row.customer_number_preview ? `Pending -> ${row.customer_number_preview}` : "Pending";
}

function createEmptyContact(
    overrides?: Partial<PlatformSalesCreateContactInput>,
): PlatformSalesCreateContactInput {
    return {
        full_name: "",
        title: "",
        email: "",
        main_phone: "",
        extension: "",
        cell_phone: "",
        recommended_permission_role: "General Contact",
        decision_priority: "General Contact",
        ...overrides,
    };
}

function createEmptyService(
    overrides?: Partial<PlatformSalesCreateServiceInput>,
): PlatformSalesCreateServiceInput {
    return {
        service_name: "",
        service_type: "SaaS Subscription",
        status: "Proposed",
        billing_cycle: "Monthly",
        price_display: "",
        ...overrides,
    };
}

const initialFormState: SalesFormState = {
    legal_name: "",
    display_name: "",
    slug: "",
    authorized_purchasing_contact: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    main_phone: "",
    extension: "",
    cell_phone: "",
    website: "",
    industry: "",
    company_size: "",
    sales_consultant_name: "",
    account_manager_name: "",
    implementation_engineer_name: "",
    sales_stage: "Lead",
    quote_status: "Not Started",
    contract_status: "Not Started",
    timezone: "America/New_York",
    expected_close_date: "",
    desired_go_live_date: "",
    estimated_monthly_value_display: "$499 / month",
    proposed_connector_count: 1,
    proposed_license_count: 25,
    payment_confirmed: false,
    account_manager_intro_complete: false,
    ready_for_implementation: false,
    notes: "",
    contacts: [
        createEmptyContact({
            recommended_permission_role: "Administrator",
            decision_priority: "Primary Decision Maker",
        }),
        createEmptyContact({
            recommended_permission_role: "Billing",
            decision_priority: "Billing Contact",
        }),
    ],
    services: [
        createEmptyService({
            service_name: "Herra Cloud SaaS",
            service_type: "SaaS Subscription",
            status: "Proposed",
            billing_cycle: "Monthly",
            price_display: "$499 / month",
        }),
    ],
};

export default function SalesPage() {
    const { token } = useAuth();
    const [opportunities, setOpportunities] = useState<PlatformSalesOpportunityListItem[]>([]);
    const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState<PlatformSalesOpportunityDetail | null>(null);
    const [listError, setListError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isListLoading, setIsListLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedContactIndex, setSelectedContactIndex] = useState(0);
    const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
    const [formState, setFormState] = useState<SalesFormState>(initialFormState);

    useEffect(() => {
        let isMounted = true;

        async function loadSales() {
            if (!token) {
                return;
            }

            setIsListLoading(true);
            setListError("");

            try {
                const response = await getPlatformSalesOpportunities(token);

                if (!isMounted) {
                    return;
                }

                setOpportunities(response);
                setSelectedOpportunityId((current) => current ?? response[0]?.id ?? null);
            } catch (error) {
                if (isMounted) {
                    setListError(error instanceof Error ? error.message : "Failed to load sales opportunities.");
                }
            } finally {
                if (isMounted) {
                    setIsListLoading(false);
                }
            }
        }

        void loadSales();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        async function loadOpportunityDetail() {
            if (!token || selectedOpportunityId === null) {
                setSelectedOpportunity(null);
                return;
            }

            setIsDetailLoading(true);
            setDetailError("");

            try {
                const response = await getPlatformSalesOpportunityDetail(token, selectedOpportunityId);

                if (isMounted) {
                    setSelectedOpportunity(response);
                }
            } catch (error) {
                if (isMounted) {
                    setDetailError(error instanceof Error ? error.message : "Failed to load sales opportunity detail.");
                }
            } finally {
                if (isMounted) {
                    setIsDetailLoading(false);
                }
            }
        }

        void loadOpportunityDetail();

        return () => {
            isMounted = false;
        };
    }, [token, selectedOpportunityId]);

    const leadCount = useMemo(
        () => opportunities.filter((item) => item.sales_stage === "Lead").length,
        [opportunities],
    );

    const signedCount = useMemo(
        () => opportunities.filter((item) => item.contract_status === "Signed").length,
        [opportunities],
    );

    const autoReadyCount = useMemo(
        () => opportunities.filter((item) => item.auto_customer_ready && item.handoff_customer_id === null).length,
        [opportunities],
    );

    const convertedCount = useMemo(
        () => opportunities.filter((item) => item.handoff_customer_id !== null).length,
        [opportunities],
    );

    const currentContact = formState.contacts[selectedContactIndex] ?? null;
    const currentService = formState.services[selectedServiceIndex] ?? null;

    const updateField = (field: keyof SalesFormState, value: string | number | boolean) => {
        setFormState((current) => ({ ...current, [field]: value }));
    };

    const updateContact = (
        index: number,
        field: keyof PlatformSalesCreateContactInput,
        value: string,
    ) => {
        setFormState((current) => ({
            ...current,
            contacts: current.contacts.map((contact, contactIndex) =>
                contactIndex === index ? { ...contact, [field]: value } : contact,
            ),
        }));
    };

    const updateService = (
        index: number,
        field: keyof PlatformSalesCreateServiceInput,
        value: string,
    ) => {
        setFormState((current) => ({
            ...current,
            services: current.services.map((service, serviceIndex) =>
                serviceIndex === index ? { ...service, [field]: value } : service,
            ),
        }));
    };

    const addContact = () => {
        setFormState((current) => ({
            ...current,
            contacts: [...current.contacts, createEmptyContact()],
        }));
        setSelectedContactIndex(formState.contacts.length);
    };

    const removeContact = (index: number) => {
        setFormState((current) => {
            const nextContacts = current.contacts.filter((_, contactIndex) => contactIndex !== index);
            return {
                ...current,
                contacts: nextContacts.length > 0 ? nextContacts : [createEmptyContact()],
            };
        });

        setSelectedContactIndex((current) => {
            if (index === 0) {
                return 0;
            }
            return Math.max(0, current - 1);
        });
    };

    const addService = () => {
        setFormState((current) => ({
            ...current,
            services: [...current.services, createEmptyService()],
        }));
        setSelectedServiceIndex(formState.services.length);
    };

    const removeService = (index: number) => {
        setFormState((current) => {
            const nextServices = current.services.filter((_, serviceIndex) => serviceIndex !== index);
            return {
                ...current,
                services: nextServices.length > 0 ? nextServices : [createEmptyService()],
            };
        });

        setSelectedServiceIndex((current) => {
            if (index === 0) {
                return 0;
            }
            return Math.max(0, current - 1);
        });
    };

    const handleCreateOpportunity = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            return;
        }

        setIsSubmitting(true);
        setListError("");
        setDetailError("");
        setSuccessMessage("");

        try {
            const contactsToSave = formState.contacts.filter(
                (contact) =>
                    contact.full_name.trim() ||
                    contact.email.trim() ||
                    contact.main_phone.trim() ||
                    contact.extension.trim() ||
                    contact.title.trim(),
            );

            if (contactsToSave.length === 0) {
                throw new Error("At least one contact is required.");
            }

            const primaryDecisionMaker = contactsToSave.find(
                (contact) => contact.decision_priority === "Primary Decision Maker",
            );

            if (!primaryDecisionMaker) {
                throw new Error("At least one contact must be marked as Primary Decision Maker.");
            }

            const servicesToSave = formState.services.filter(
                (service) =>
                    service.service_name.trim() ||
                    service.service_type.trim() ||
                    service.price_display.trim(),
            );

            if (servicesToSave.length === 0) {
                throw new Error("At least one proposed service is required.");
            }

            const payload: PlatformSalesCreateOpportunityInput = {
                ...formState,
                slug: formState.slug.trim() || buildSlug(formState.display_name),
                contacts: contactsToSave,
                services: servicesToSave,
            };

            const createdOpportunity = await createPlatformSalesOpportunity(token, payload);
            const refreshedOpportunities = await getPlatformSalesOpportunities(token);

            setOpportunities(refreshedOpportunities);
            setSelectedOpportunityId(createdOpportunity.id);
            setSelectedOpportunity(createdOpportunity);
            setSelectedContactIndex(0);
            setSelectedServiceIndex(0);
            setFormState(initialFormState);

            if (createdOpportunity.handoff_customer_id) {
                setSuccessMessage(
                    `${createdOpportunity.display_name} was created and automatically moved into Customers as ${createdOpportunity.customer_number_preview || "the new customer account"} because contract, payment, account manager intro, and implementation readiness were all completed.`,
                );
            } else {
                setSuccessMessage(`Sales opportunity ${createdOpportunity.display_name} created successfully.`);
            }
        } catch (error) {
            setListError(error instanceof Error ? error.message : "Failed to create sales opportunity.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Sales"
                subtitle="Manage prospects, quotes, contract progress, proposed services, internal ownership, payment confirmation, account-manager introduction, and automatic conversion into live customer accounts."
            />

            {successMessage ? <div className="success-banner">{successMessage}</div> : null}
            {listError ? <div className="error-banner">{listError}</div> : null}
            {detailError ? <div className="error-banner">{detailError}</div> : null}

            <div className="stats-grid">
                <SectionCard title="Pipeline Overview">
                    <div className="metric-line">
                        <span>Total opportunities</span>
                        <strong>{opportunities.length}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Lead stage</span>
                        <strong>{leadCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Contract Activity">
                    <div className="metric-line">
                        <span>Signed contracts</span>
                        <strong>{signedCount}</strong>
                    </div>
                    <div className="metric-line">
                        <span>List status</span>
                        <strong>{isListLoading ? "Refreshing" : "Ready"}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Automatic Conversion">
                    <div className="metric-line">
                        <span>Ready for auto-conversion</span>
                        <strong>{autoReadyCount}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Already converted</span>
                        <strong>{convertedCount}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Selected Opportunity">
                    <div className="metric-line">
                        <span>Current focus</span>
                        <strong>{selectedOpportunity?.display_name ?? "None selected"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Stage</span>
                        <strong>{selectedOpportunity?.sales_stage ?? "Not available"}</strong>
                    </div>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Sales Pipeline">
                    {isListLoading ? (
                        <LoadingState message="Loading sales opportunities..." />
                    ) : opportunities.length === 0 ? (
                        <EmptyState message="No sales opportunities have been created yet." />
                    ) : (
                        <DataTable
                            columns={[
                                {
                                    header: "Company",
                                    render: (row) => (
                                        <button
                                            className="ghost-button"
                                            onClick={() => setSelectedOpportunityId(row.id)}
                                            type="button"
                                        >
                                            {row.display_name}
                                        </button>
                                    ),
                                },
                                { header: "Sales Stage", render: (row) => <StatusBadge status={row.sales_stage} /> },
                                { header: "Quote", render: (row) => row.quote_status },
                                { header: "Contract", render: (row) => row.contract_status },
                                { header: "Sales Consultant", render: (row) => row.sales_consultant_name },
                                { header: "Value", render: (row) => row.estimated_monthly_value_display },
                                { header: "Type", render: (row) => row.opportunity_kind },
                                {
                                    header: "Conversion",
                                    render: (row) => renderCustomerConversionLabel(row),
                                },
                            ]}
                            rows={opportunities}
                            keyExtractor={(row) => String(row.id)}
                        />
                    )}
                </SectionCard>

                <SectionCard title="Selected Opportunity Overview">
                    {isDetailLoading ? (
                        <LoadingState message="Loading sales opportunity..." />
                    ) : !selectedOpportunity ? (
                        <EmptyState message="Select a sales opportunity to review the current deal." />
                    ) : (
                        <div className="three-column-grid">
                            <div>
                                <div className="metric-line">
                                    <span>Display name</span>
                                    <strong>{selectedOpportunity.display_name}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Legal name</span>
                                    <strong>{selectedOpportunity.legal_name}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Authorized purchasing contact</span>
                                    <strong>{selectedOpportunity.authorized_purchasing_contact}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Opportunity type</span>
                                    <strong>{selectedOpportunity.opportunity_kind}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Customer number preview</span>
                                    <strong>{selectedOpportunity.customer_number_preview || "Will be assigned at conversion"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Sales stage</span>
                                    <strong>
                                        <StatusBadge status={selectedOpportunity.sales_stage} />
                                    </strong>
                                </div>
                                <div className="metric-line">
                                    <span>Quote status</span>
                                    <strong>{selectedOpportunity.quote_status}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Contract status</span>
                                    <strong>{selectedOpportunity.contract_status}</strong>
                                </div>
                            </div>

                            <div>
                                <div className="metric-line">
                                    <span>Expected close date</span>
                                    <strong>{selectedOpportunity.expected_close_date || "Not set"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Desired go-live date</span>
                                    <strong>{selectedOpportunity.desired_go_live_date || "Not set"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Estimated monthly value</span>
                                    <strong>{selectedOpportunity.estimated_monthly_value_display}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Proposed connectors</span>
                                    <strong>{selectedOpportunity.proposed_connector_count}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Proposed licenses</span>
                                    <strong>{selectedOpportunity.proposed_license_count}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Auto-conversion ready</span>
                                    <strong>{selectedOpportunity.auto_customer_ready ? "Yes" : "No"}</strong>
                                </div>
                            </div>

                            <div>
                                <div className="metric-line">
                                    <span>Sales consultant</span>
                                    <strong>{selectedOpportunity.sales_consultant_name}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Account manager</span>
                                    <strong>{selectedOpportunity.account_manager_name}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Implementation engineer</span>
                                    <strong>{selectedOpportunity.implementation_engineer_name}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Customer conversion</span>
                                    <strong>
                                        {selectedOpportunity.handoff_customer_id
                                            ? selectedOpportunity.customer_number_preview || `Customer #${selectedOpportunity.handoff_customer_id}`
                                            : "Not converted yet"}
                                    </strong>
                                </div>
                                <div className="metric-line">
                                    <span>Primary website</span>
                                    <strong>{selectedOpportunity.website}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Industry / size</span>
                                    <strong>{`${selectedOpportunity.industry} / ${selectedOpportunity.company_size}`}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Create Sales Opportunity">
                <form className="login-form" onSubmit={handleCreateOpportunity} style={{ maxWidth: "100%" }}>
                    <div className="three-column-grid">
                        <label className="field-group">
                            <span>Company Legal Name</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.legal_name}
                                onChange={(event) => updateField("legal_name", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Display Name / DBA</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.display_name}
                                onChange={(event) => {
                                    updateField("display_name", event.target.value);
                                    updateField("slug", buildSlug(event.target.value));
                                }}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Sales Slug</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.slug}
                                onChange={(event) => updateField("slug", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Authorized Purchasing Contact</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.authorized_purchasing_contact}
                                onChange={(event) => updateField("authorized_purchasing_contact", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Address</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.address}
                                onChange={(event) => updateField("address", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Website</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.website}
                                onChange={(event) => updateField("website", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>City</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.city}
                                onChange={(event) => updateField("city", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>State</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.state}
                                onChange={(event) => updateField("state", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>ZIP Code</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.zip_code}
                                onChange={(event) => updateField("zip_code", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Country</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.country}
                                onChange={(event) => updateField("country", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Main Phone</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.main_phone}
                                onChange={(event) => updateField("main_phone", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Extension</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.extension}
                                onChange={(event) => updateField("extension", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Cell Phone</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.cell_phone}
                                onChange={(event) => updateField("cell_phone", event.target.value)}
                            />
                        </label>

                        <label className="field-group">
                            <span>Industry</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.industry}
                                onChange={(event) => updateField("industry", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Company Size</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.company_size}
                                onChange={(event) => updateField("company_size", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Sales Consultant</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.sales_consultant_name}
                                onChange={(event) => updateField("sales_consultant_name", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Account Manager</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.account_manager_name}
                                onChange={(event) => updateField("account_manager_name", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Implementation Engineer</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.implementation_engineer_name}
                                onChange={(event) => updateField("implementation_engineer_name", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Sales Stage</span>
                            <select
                                className="field-input"
                                value={formState.sales_stage}
                                onChange={(event) => updateField("sales_stage", event.target.value)}
                            >
                                {SALES_STAGE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="field-group">
                            <span>Quote Status</span>
                            <select
                                className="field-input"
                                value={formState.quote_status}
                                onChange={(event) => updateField("quote_status", event.target.value)}
                            >
                                {QUOTE_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="field-group">
                            <span>Contract Status</span>
                            <select
                                className="field-input"
                                value={formState.contract_status}
                                onChange={(event) => updateField("contract_status", event.target.value)}
                            >
                                {CONTRACT_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="field-group">
                            <span>Timezone</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.timezone}
                                onChange={(event) => updateField("timezone", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Expected Close Date</span>
                            <input
                                className="field-input"
                                type="date"
                                value={formState.expected_close_date}
                                onChange={(event) => updateField("expected_close_date", event.target.value)}
                            />
                        </label>

                        <label className="field-group">
                            <span>Desired Go-Live Date</span>
                            <input
                                className="field-input"
                                type="date"
                                value={formState.desired_go_live_date}
                                onChange={(event) => updateField("desired_go_live_date", event.target.value)}
                            />
                        </label>

                        <label className="field-group">
                            <span>Estimated Monthly Value</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.estimated_monthly_value_display}
                                onChange={(event) => updateField("estimated_monthly_value_display", event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Proposed Connector Count</span>
                            <input
                                className="field-input"
                                type="number"
                                min={0}
                                value={formState.proposed_connector_count}
                                onChange={(event) =>
                                    updateField("proposed_connector_count", Number(event.target.value || 0))
                                }
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Proposed License Count</span>
                            <input
                                className="field-input"
                                type="number"
                                min={0}
                                value={formState.proposed_license_count}
                                onChange={(event) =>
                                    updateField("proposed_license_count", Number(event.target.value || 0))
                                }
                                required
                            />
                        </label>
                    </div>

                    <label className="field-group" style={{ marginTop: "10px" }}>
                        <span>Sales Notes</span>
                        <textarea
                            className="field-input"
                            value={formState.notes}
                            onChange={(event) => updateField("notes", event.target.value)}
                            rows={4}
                        />
                    </label>

                    <SectionCard title="Automatic Conversion Checkpoints">
                        <div className="three-column-grid">
                            <label
                                className="field-group"
                                style={{ display: "flex", alignItems: "center", gap: "12px" }}
                            >
                                <span>Payment Confirmed</span>
                                <input
                                    type="checkbox"
                                    checked={formState.payment_confirmed}
                                    onChange={(event) => updateField("payment_confirmed", event.target.checked)}
                                />
                            </label>

                            <label
                                className="field-group"
                                style={{ display: "flex", alignItems: "center", gap: "12px" }}
                            >
                                <span>Account Manager Intro Complete</span>
                                <input
                                    type="checkbox"
                                    checked={formState.account_manager_intro_complete}
                                    onChange={(event) =>
                                        updateField("account_manager_intro_complete", event.target.checked)
                                    }
                                />
                            </label>

                            <label
                                className="field-group"
                                style={{ display: "flex", alignItems: "center", gap: "12px" }}
                            >
                                <span>Ready for Implementation</span>
                                <input
                                    type="checkbox"
                                    checked={formState.ready_for_implementation}
                                    onChange={(event) =>
                                        updateField("ready_for_implementation", event.target.checked)
                                    }
                                />
                            </label>
                        </div>
                    </SectionCard>

                    <SectionCard title="Decision Makers and Contacts">
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                            {formState.contacts.map((contact, index) => (
                                <button
                                    key={`contact-selector-${index}`}
                                    className={index === selectedContactIndex ? "primary-button" : "ghost-button"}
                                    onClick={() => setSelectedContactIndex(index)}
                                    type="button"
                                >
                                    Contact {index + 1}
                                </button>
                            ))}
                            <button className="ghost-button" onClick={addContact} type="button">
                                Add Another Contact
                            </button>
                        </div>

                        {currentContact ? (
                            <SectionCard title={`Contact ${selectedContactIndex + 1}`}>
                                <div className="three-column-grid">
                                    <label className="field-group">
                                        <span>Full Name</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentContact.full_name}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "full_name", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Title</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentContact.title}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "title", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Email</span>
                                        <input
                                            className="field-input"
                                            type="email"
                                            value={currentContact.email}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "email", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Main Phone</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentContact.main_phone}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "main_phone", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Extension</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentContact.extension}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "extension", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Cell Phone</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentContact.cell_phone}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "cell_phone", event.target.value)
                                            }
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Recommended Permission Role</span>
                                        <select
                                            className="field-input"
                                            value={currentContact.recommended_permission_role}
                                            onChange={(event) =>
                                                updateContact(
                                                    selectedContactIndex,
                                                    "recommended_permission_role",
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {CONTACT_PERMISSION_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="field-group">
                                        <span>Decision Priority</span>
                                        <select
                                            className="field-input"
                                            value={currentContact.decision_priority}
                                            onChange={(event) =>
                                                updateContact(selectedContactIndex, "decision_priority", event.target.value)
                                            }
                                        >
                                            {DECISION_PRIORITY_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        className="ghost-button"
                                        onClick={() => removeContact(selectedContactIndex)}
                                        type="button"
                                        disabled={formState.contacts.length <= 1}
                                    >
                                        Remove Contact
                                    </button>
                                </div>
                            </SectionCard>
                        ) : null}
                    </SectionCard>

                    <SectionCard title="Proposed Services and Packages">
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                            {formState.services.map((service, index) => (
                                <button
                                    key={`service-selector-${index}`}
                                    className={index === selectedServiceIndex ? "primary-button" : "ghost-button"}
                                    onClick={() => setSelectedServiceIndex(index)}
                                    type="button"
                                >
                                    Service {index + 1}
                                </button>
                            ))}
                            <button className="ghost-button" onClick={addService} type="button">
                                Add Another Service
                            </button>
                        </div>

                        {currentService ? (
                            <SectionCard title={`Service ${selectedServiceIndex + 1}`}>
                                <div className="three-column-grid">
                                    <label className="field-group">
                                        <span>Service Name</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentService.service_name}
                                            onChange={(event) =>
                                                updateService(selectedServiceIndex, "service_name", event.target.value)
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="field-group">
                                        <span>Service Type</span>
                                        <select
                                            className="field-input"
                                            value={currentService.service_type}
                                            onChange={(event) =>
                                                updateService(selectedServiceIndex, "service_type", event.target.value)
                                            }
                                        >
                                            {SERVICE_TYPE_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="field-group">
                                        <span>Status</span>
                                        <select
                                            className="field-input"
                                            value={currentService.status}
                                            onChange={(event) =>
                                                updateService(selectedServiceIndex, "status", event.target.value)
                                            }
                                        >
                                            {SERVICE_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="field-group">
                                        <span>Billing Cycle</span>
                                        <select
                                            className="field-input"
                                            value={currentService.billing_cycle}
                                            onChange={(event) =>
                                                updateService(selectedServiceIndex, "billing_cycle", event.target.value)
                                            }
                                        >
                                            {BILLING_CYCLE_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="field-group">
                                        <span>Displayed Price</span>
                                        <input
                                            className="field-input"
                                            type="text"
                                            value={currentService.price_display}
                                            onChange={(event) =>
                                                updateService(selectedServiceIndex, "price_display", event.target.value)
                                            }
                                            required
                                        />
                                    </label>
                                </div>

                                <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        className="ghost-button"
                                        onClick={() => removeService(selectedServiceIndex)}
                                        type="button"
                                        disabled={formState.services.length <= 1}
                                    >
                                        Remove Service
                                    </button>
                                </div>
                            </SectionCard>
                        ) : null}
                    </SectionCard>

                    <button className="primary-button" disabled={isSubmitting} type="submit">
                        {isSubmitting ? "Creating opportunity..." : "Create sales opportunity"}
                    </button>
                </form>
            </SectionCard>

            <div className="two-column-grid">
                <SectionCard title="Selected Opportunity Contacts">
                    {!selectedOpportunity ? (
                        <EmptyState message="Select a sales opportunity to review collected contacts." />
                    ) : selectedOpportunity.contacts.length === 0 ? (
                        <EmptyState message="No contacts are stored for this opportunity." />
                    ) : (
                        <DataTable
                            columns={[
                                { header: "Name", render: (row) => row.full_name },
                                { header: "Title", render: (row) => row.title },
                                { header: "Email", render: (row) => row.email },
                                {
                                    header: "Phone",
                                    render: (row) =>
                                        `${row.main_phone}${row.extension ? ` x${row.extension}` : ""}`,
                                },
                                { header: "Cell", render: (row) => row.cell_phone || "—" },
                                {
                                    header: "Recommended Role",
                                    render: (row) => row.recommended_permission_role,
                                },
                                { header: "Decision Priority", render: (row) => row.decision_priority },
                            ]}
                            rows={selectedOpportunity?.contacts ?? []}
                            keyExtractor={(row, index) => `${row.email}-${index}`}
                        />
                    )}
                </SectionCard>

                <SectionCard title="Selected Opportunity Services">
                    {!selectedOpportunity ? (
                        <EmptyState message="Select a sales opportunity to review proposed services." />
                    ) : selectedOpportunity.services.length === 0 ? (
                        <EmptyState message="No services are stored for this opportunity." />
                    ) : (
                        <DataTable
                            columns={[
                                { header: "Service", render: (row) => row.service_name },
                                { header: "Type", render: (row) => row.service_type },
                                { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                                { header: "Billing", render: (row) => row.billing_cycle },
                                { header: "Price", render: (row) => row.price_display },
                            ]}
                            rows={selectedOpportunity?.services ?? []}
                            keyExtractor={(row, index) => `${row.service_name}-${index}`}
                        />
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Automatic Customer Conversion Rules">
                {!selectedOpportunity ? (
                    <EmptyState message="Select a sales opportunity to review conversion readiness." />
                ) : (
                    <div className="three-column-grid">
                        <div>
                            <div className="metric-line">
                                <span>Contract signed</span>
                                <strong>{selectedOpportunity.contract_status === "Signed" ? "Yes" : "No"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Payment confirmed</span>
                                <strong>{selectedOpportunity.payment_confirmed ? "Yes" : "No"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Account manager intro complete</span>
                                <strong>{selectedOpportunity.account_manager_intro_complete ? "Yes" : "No"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Ready for implementation</span>
                                <strong>{selectedOpportunity.ready_for_implementation ? "Yes" : "No"}</strong>
                            </div>
                        </div>

                        <div>
                            <div className="metric-line">
                                <span>Automatic conversion ready</span>
                                <strong>{selectedOpportunity.auto_customer_ready ? "Yes" : "No"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Customer created</span>
                                <strong>
                                    {selectedOpportunity.handoff_customer_id
                                        ? selectedOpportunity.customer_number_preview || `Customer #${selectedOpportunity.handoff_customer_id}`
                                        : "No"}
                                </strong>
                            </div>
                            <div className="metric-line">
                                <span>System behavior</span>
                                <strong>
                                    {selectedOpportunity.handoff_customer_id
                                        ? "Already moved to Customers"
                                        : selectedOpportunity.auto_customer_ready
                                            ? "Will auto-create as Customer"
                                            : "Stays in Sales"}
                                </strong>
                            </div>
                        </div>

                        <div>
                            <div className="metric-line">
                                <span>Workflow note</span>
                                <strong>
                                    Sales closes the deal. Account manager introduces the customer. Implementation readiness is confirmed. Then the system creates the Customer automatically. Renewals stay on the same customer account and increment the term automatically.
                                </strong>
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>
        </>
    );
}