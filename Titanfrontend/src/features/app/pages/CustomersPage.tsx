import { useEffect, useState } from "react";
import { getPlatformCustomerDetail, getPlatformCustomers } from "../../../api/customers";
import { createPlatformRenewalOpportunity } from "../../../api/sales";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { useAuth } from "../../../hooks/auth/useAuth";

type NormalizedCustomerListItem = {
    id: number;
    customerNumber: string;
    baseAccountNumber: number;
    termNumber: number;
    displayName: string;
    legalName: string;
    customerStatus: string;
    billingStatus: string;
    primaryContactName: string;
    primaryContactEmail: string;
    accountManagerName: string;
    supportTierName: string;
    deploymentCount: number;
    connectorCount: number;
    notesSummary: string;
};

type NormalizedCustomerContact = {
    contactSource: string;
    fullName: string;
    title: string;
    email: string;
    mainPhone: string;
    extension: string;
    cellPhone: string;
    permissionRole: string;
    decisionPriority: string;
};

type NormalizedCustomerDeployment = {
    licenseId: string;
    serviceName: string;
    status: string;
};

type NormalizedCustomerConnector = {
    licenseId: string;
    connectorName: string;
    status: string;
};

type NormalizedSupportSummary = {
    tierName: string;
    responseTarget: string;
    coverageHours: string;
    includedChannels: string[];
    escalationLevel: string;
    notes: string;
};

type NormalizedCustomerDetail = {
    id: number;
    customerNumber: string;
    baseAccountNumber: number;
    termNumber: number;
    slug: string;
    displayName: string;
    legalName: string;
    authorizedPurchasingContact: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    mainPhone: string;
    extension: string;
    cellPhone: string;
    website: string;
    industry: string;
    companySize: string;
    notes: string;
    contractStartDate: string;
    renewalDate: string;
    billingStatus: string;
    customerStatus: string;
    accountManagerName: string;
    salesConsultantName: string;
    implementationEngineerName: string;
    contacts: NormalizedCustomerContact[];
    deployments: NormalizedCustomerDeployment[];
    connectors: NormalizedCustomerConnector[];
    supportSummary: NormalizedSupportSummary;
};

function stringOrEmpty(value: unknown) {
    return typeof value === "string" ? value : "";
}

function numberOrZero(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function customerNumberOrFallback(customerNumber: unknown, customerId: unknown) {
    const normalizedCustomerNumber = stringOrEmpty(customerNumber);
    if (normalizedCustomerNumber) {
        return normalizedCustomerNumber;
    }

    const normalizedCustomerId = numberOrZero(customerId);
    return normalizedCustomerId > 0 ? `CUST-${String(normalizedCustomerId).padStart(4, "0")}` : "Not available";
}

function normalizeCustomerListItem(raw: any): NormalizedCustomerListItem {
    return {
        id: numberOrZero(raw?.id),
        customerNumber: customerNumberOrFallback(raw?.customer_number, raw?.id),
        baseAccountNumber: numberOrZero(raw?.base_account_number),
        termNumber: numberOrZero(raw?.term_number),
        displayName: stringOrEmpty(raw?.display_name || raw?.name),
        legalName: stringOrEmpty(raw?.legal_name || raw?.name),
        customerStatus: stringOrEmpty(raw?.customer_status || raw?.status),
        billingStatus: stringOrEmpty(raw?.billing_status || "Unknown"),
        primaryContactName: stringOrEmpty(raw?.primary_contact_name),
        primaryContactEmail: stringOrEmpty(raw?.primary_contact_email),
        accountManagerName: stringOrEmpty(raw?.account_manager_name || "Not assigned"),
        supportTierName: stringOrEmpty(raw?.support_tier_name || "Standard"),
        deploymentCount: numberOrZero(raw?.deployment_count || raw?.active_product_count),
        connectorCount: numberOrZero(raw?.connector_count),
        notesSummary: stringOrEmpty(raw?.notes_summary),
    };
}

function normalizeCustomerContact(raw: any): NormalizedCustomerContact {
    return {
        contactSource: stringOrEmpty(raw?.contact_source || "Legacy Record"),
        fullName: stringOrEmpty(raw?.full_name || raw?.name),
        title: stringOrEmpty(raw?.title),
        email: stringOrEmpty(raw?.email),
        mainPhone: stringOrEmpty(raw?.main_phone || raw?.phone),
        extension: stringOrEmpty(raw?.extension),
        cellPhone: stringOrEmpty(raw?.cell_phone),
        permissionRole: stringOrEmpty(raw?.permission_role || raw?.contact_type || "General Contact"),
        decisionPriority: stringOrEmpty(raw?.decision_priority || raw?.contact_type || "General Contact"),
    };
}

function normalizeCustomerDetail(raw: any): NormalizedCustomerDetail {
    const companyDetails = raw?.company_details ?? {};
    const assignments = Array.isArray(raw?.assignments) ? raw.assignments : [];

    const accountManagerFromAssignments =
        assignments.find((assignment: any) =>
            stringOrEmpty(assignment?.assignment_type).toLowerCase().includes("account"),
        ) ?? null;

    const salesConsultantFromAssignments =
        assignments.find((assignment: any) =>
            stringOrEmpty(assignment?.assignment_type).toLowerCase().includes("sales"),
        ) ?? null;

    const implementationEngineerFromAssignments =
        assignments.find((assignment: any) =>
            stringOrEmpty(assignment?.assignment_type).toLowerCase().includes("implementation"),
        ) ?? null;

    const rawContacts = Array.isArray(raw?.contacts) ? raw.contacts : [];
    const rawDeployments = Array.isArray(raw?.deployments)
        ? raw.deployments
        : Array.isArray(raw?.products)
            ? raw.products
            : [];
    const rawConnectors = Array.isArray(raw?.connectors) ? raw.connectors : [];

    return {
        id: numberOrZero(raw?.id),
        customerNumber: customerNumberOrFallback(raw?.customer_number, raw?.id),
        baseAccountNumber: numberOrZero(raw?.base_account_number),
        termNumber: numberOrZero(raw?.term_number),
        slug: stringOrEmpty(raw?.slug),
        displayName: stringOrEmpty(companyDetails?.display_name || raw?.display_name || raw?.name),
        legalName: stringOrEmpty(companyDetails?.legal_name || raw?.legal_name || raw?.name),
        authorizedPurchasingContact: stringOrEmpty(
            companyDetails?.authorized_purchasing_contact || raw?.primary_contact_name,
        ),
        address: stringOrEmpty(companyDetails?.address),
        city: stringOrEmpty(companyDetails?.city),
        state: stringOrEmpty(companyDetails?.state),
        zipCode: stringOrEmpty(companyDetails?.zip_code),
        country: stringOrEmpty(companyDetails?.country),
        mainPhone: stringOrEmpty(companyDetails?.main_phone),
        extension: stringOrEmpty(companyDetails?.extension),
        cellPhone: stringOrEmpty(companyDetails?.cell_phone),
        website: stringOrEmpty(companyDetails?.website),
        industry: stringOrEmpty(companyDetails?.industry),
        companySize: stringOrEmpty(companyDetails?.company_size),
        notes: stringOrEmpty(companyDetails?.notes || raw?.notes),
        contractStartDate: stringOrEmpty(companyDetails?.contract_start_date),
        renewalDate: stringOrEmpty(companyDetails?.renewal_date),
        billingStatus: stringOrEmpty(raw?.billing_status || "Unknown"),
        customerStatus: stringOrEmpty(raw?.customer_status || raw?.status),
        accountManagerName: stringOrEmpty(
            raw?.account_manager?.name || accountManagerFromAssignments?.platform_user_name || "Not assigned",
        ),
        salesConsultantName: stringOrEmpty(
            raw?.sales_consultant?.name || salesConsultantFromAssignments?.platform_user_name || "Not assigned",
        ),
        implementationEngineerName: stringOrEmpty(
            raw?.implementation_engineer?.name ||
            implementationEngineerFromAssignments?.platform_user_name ||
            "Not assigned",
        ),
        contacts: rawContacts.map(normalizeCustomerContact),
        deployments: rawDeployments.map((deployment: any) => ({
            licenseId: stringOrEmpty(deployment?.license_id || deployment?.code),
            serviceName: stringOrEmpty(deployment?.service_name || deployment?.name),
            status: stringOrEmpty(deployment?.status),
        })),
        connectors: rawConnectors.map((connector: any) => ({
            licenseId: stringOrEmpty(connector?.license_id),
            connectorName: stringOrEmpty(connector?.connector_name || connector?.name),
            status: stringOrEmpty(connector?.status),
        })),
        supportSummary: {
            tierName: stringOrEmpty(raw?.support_summary?.tier_name || "Standard"),
            responseTarget: stringOrEmpty(raw?.support_summary?.response_target || "Not available"),
            coverageHours: stringOrEmpty(raw?.support_summary?.coverage_hours || "Not available"),
            includedChannels: Array.isArray(raw?.support_summary?.included_channels)
                ? raw.support_summary.included_channels.map((channel: unknown) => stringOrEmpty(channel)).filter(Boolean)
                : [],
            escalationLevel: stringOrEmpty(raw?.support_summary?.escalation_level || "Not available"),
            notes: stringOrEmpty(raw?.support_summary?.notes || "Not available"),
        },
    };
}

export default function CustomersPage() {
    const { token } = useAuth();
    const [customers, setCustomers] = useState<NormalizedCustomerListItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<NormalizedCustomerDetail | null>(null);
    const [listError, setListError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [renewalError, setRenewalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isListLoading, setIsListLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isCreatingRenewal, setIsCreatingRenewal] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadCustomers() {
            if (!token) {
                return;
            }

            setIsListLoading(true);
            setListError("");

            try {
                const response = await getPlatformCustomers(token);
                const normalized = Array.isArray(response) ? response.map(normalizeCustomerListItem) : [];

                if (!isMounted) {
                    return;
                }

                setCustomers(normalized);
                setSelectedCustomerId((current) => current ?? normalized[0]?.id ?? null);
            } catch (error) {
                if (isMounted) {
                    setListError(error instanceof Error ? error.message : "Failed to load customers.");
                }
            } finally {
                if (isMounted) {
                    setIsListLoading(false);
                }
            }
        }

        void loadCustomers();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        async function loadCustomerDetail() {
            if (!token || selectedCustomerId === null) {
                setSelectedCustomer(null);
                return;
            }

            setIsDetailLoading(true);
            setDetailError("");

            try {
                const response = await getPlatformCustomerDetail(token, selectedCustomerId);
                const normalized = normalizeCustomerDetail(response);

                if (isMounted) {
                    setSelectedCustomer(normalized);
                }
            } catch (error) {
                if (isMounted) {
                    setDetailError(error instanceof Error ? error.message : "Failed to load customer detail.");
                }
            } finally {
                if (isMounted) {
                    setIsDetailLoading(false);
                }
            }
        }

        void loadCustomerDetail();

        return () => {
            isMounted = false;
        };
    }, [token, selectedCustomerId]);

    const handleCreateRenewalOpportunity = async () => {
        if (!token || !selectedCustomer) {
            return;
        }

        setIsCreatingRenewal(true);
        setRenewalError("");
        setSuccessMessage("");

        try {
            const renewalOpportunity = await createPlatformRenewalOpportunity(token, selectedCustomer.id);
            setSuccessMessage(
                `Renewal opportunity created for ${selectedCustomer.displayName}. Sales now contains ${renewalOpportunity.customer_number_preview || selectedCustomer.customerNumber} term ${renewalOpportunity.renewal_term_number ?? selectedCustomer.termNumber + 1}.`,
            );
        } catch (error) {
            setRenewalError(error instanceof Error ? error.message : "Failed to create renewal opportunity.");
        } finally {
            setIsCreatingRenewal(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Customers"
                subtitle="Manage live customer accounts, ownership, billing and support status, contacts and permissions, linked deployments, and linked connectors."
            />

            {listError ? <div className="error-banner">{listError}</div> : null}
            {detailError ? <div className="error-banner">{detailError}</div> : null}

            <div className="stats-grid">
                <SectionCard title="Customer Accounts">
                    <div className="metric-line">
                        <span>Total managed customers</span>
                        <strong>{customers.length}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Current list status</span>
                        <strong>{isListLoading ? "Refreshing" : "Ready"}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Selected Customer">
                    <div className="metric-line">
                        <span>Current focus</span>
                        <strong>{selectedCustomer?.displayName ?? "None selected"}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Customer ID</span>
                        <strong>{selectedCustomer?.customerNumber ?? "Not available"}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Deployments and Connectors">
                    <div className="metric-line">
                        <span>Linked deployments</span>
                        <strong>{selectedCustomer?.deployments.length ?? 0}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Linked connectors</span>
                        <strong>{selectedCustomer?.connectors.length ?? 0}</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Contacts and Support">
                    <div className="metric-line">
                        <span>Contacts on file</span>
                        <strong>{selectedCustomer?.contacts.length ?? 0}</strong>
                    </div>
                    <div className="metric-line">
                        <span>Support tier</span>
                        <strong>{selectedCustomer?.supportSummary.tierName ?? "Not assigned"}</strong>
                    </div>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Customer Inventory">
                    {isListLoading ? (
                        <LoadingState message="Loading customer accounts..." />
                    ) : customers.length === 0 ? (
                        <EmptyState message="No customer accounts have been created yet." />
                    ) : (
                        <DataTable
                            columns={[
                                {
                                    header: "Customer ID",
                                    render: (row) => `CUST-${String(row.id).padStart(4, "0")}`,
                                },
                                {
                                    header: "Customer",
                                    render: (row) => (
                                        <button
                                            className="ghost-button"
                                            onClick={() => setSelectedCustomerId(row.id)}
                                            type="button"
                                        >
                                            {row.displayName}
                                        </button>
                                    ),
                                },
                                { header: "Customer Status", render: (row) => <StatusBadge status={row.customerStatus} /> },
                                { header: "Billing", render: (row) => <StatusBadge status={row.billingStatus} /> },
                                { header: "Account Manager", render: (row) => row.accountManagerName || "Not assigned" },
                                { header: "Primary Contact", render: (row) => row.primaryContactName || "Not set" },
                                { header: "Deployments", render: (row) => row.deploymentCount },
                                { header: "Connectors", render: (row) => row.connectorCount },
                            ]}
                            rows={customers}
                            keyExtractor={(row) => String(row.id)}
                        />
                    )}
                </SectionCard>

                <SectionCard title="Selected Customer Overview">
                    {isDetailLoading ? (
                        <LoadingState message="Loading customer detail..." />
                    ) : !selectedCustomer ? (
                        <EmptyState message="Select a customer to review their record." />
                    ) : (
                        <div className="three-column-grid">
                            <div>
                                <div className="metric-line">
                                    <span>Customer ID</span>
                                    <strong>{selectedCustomer.customerNumber}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Account Slug</span>
                                    <strong>{selectedCustomer.slug || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Display name</span>
                                    <strong>{selectedCustomer.displayName || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Legal name</span>
                                    <strong>{selectedCustomer.legalName || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Authorized purchasing contact</span>
                                    <strong>{selectedCustomer.authorizedPurchasingContact || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Customer status</span>
                                    <strong>
                                        <StatusBadge status={selectedCustomer.customerStatus} />
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <div className="metric-line">
                                    <span>Billing status</span>
                                    <strong>
                                        <StatusBadge status={selectedCustomer.billingStatus} />
                                    </strong>
                                </div>
                                <div className="metric-line">
                                    <span>Support tier</span>
                                    <strong>{selectedCustomer.supportSummary.tierName || "Not assigned"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Address</span>
                                    <strong>{selectedCustomer.address || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>City / State / ZIP</span>
                                    <strong>
                                        {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.zipCode]
                                            .filter(Boolean)
                                            .join(" ") || "Not available"}
                                    </strong>
                                </div>
                                <div className="metric-line">
                                    <span>Country</span>
                                    <strong>{selectedCustomer.country || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Main phone</span>
                                    <strong>
                                        {selectedCustomer.mainPhone
                                            ? `${selectedCustomer.mainPhone}${selectedCustomer.extension ? ` x${selectedCustomer.extension}` : ""}`
                                            : "Not available"}
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <div className="metric-line">
                                    <span>Cell phone</span>
                                    <strong>{selectedCustomer.cellPhone || "Not provided"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Website</span>
                                    <strong>{selectedCustomer.website || "Not available"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Account manager</span>
                                    <strong>{selectedCustomer.accountManagerName || "Not assigned"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Sales consultant</span>
                                    <strong>{selectedCustomer.salesConsultantName || "Not assigned"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Implementation engineer</span>
                                    <strong>{selectedCustomer.implementationEngineerName || "Not assigned"}</strong>
                                </div>
                                <div className="metric-line">
                                    <span>Industry / Size</span>
                                    <strong>
                                        {[selectedCustomer.industry, selectedCustomer.companySize]
                                            .filter(Boolean)
                                            .join(" / ") || "Not available"}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Contract and Renewal">
                    {!selectedCustomer ? (
                        <EmptyState message="Select a customer to review contract timing." />
                    ) : (
                        <>
                            <div className="metric-line">
                                <span>Contract start</span>
                                <strong>{selectedCustomer.contractStartDate || "Not set"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Renewal</span>
                                <strong>{selectedCustomer.renewalDate || "Not set"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Renewal workflow</span>
                                <strong>Use the existing customer account. The next term will increment automatically.</strong>
                            </div>
                            <div style={{ marginTop: "14px" }}>
                                <button
                                    className="primary-button"
                                    type="button"
                                    onClick={handleCreateRenewalOpportunity}
                                    disabled={isCreatingRenewal}
                                >
                                    {isCreatingRenewal ? "Creating renewal opportunity..." : "Create renewal opportunity in Sales"}
                                </button>
                            </div>
                            <div className="metric-line">
                                <span>Notes</span>
                                <strong>{selectedCustomer.notes || "No notes saved."}</strong>
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Support Summary">
                    {!selectedCustomer ? (
                        <EmptyState message="Select a customer to review support details." />
                    ) : (
                        <>
                            <div className="metric-line">
                                <span>Tier</span>
                                <strong>{selectedCustomer.supportSummary.tierName || "Not available"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Response target</span>
                                <strong>{selectedCustomer.supportSummary.responseTarget || "Not available"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Coverage hours</span>
                                <strong>{selectedCustomer.supportSummary.coverageHours || "Not available"}</strong>
                            </div>
                            <div className="metric-line">
                                <span>Included channels</span>
                                <strong>
                                    {selectedCustomer.supportSummary.includedChannels.length > 0
                                        ? selectedCustomer.supportSummary.includedChannels.join(", ")
                                        : "Not available"}
                                </strong>
                            </div>
                            <div className="metric-line">
                                <span>Escalation level</span>
                                <strong>{selectedCustomer.supportSummary.escalationLevel || "Not available"}</strong>
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Customer Contacts and Permissions">
                    {!selectedCustomer ? (
                        <EmptyState message="Select a customer to review contacts and permissions." />
                    ) : selectedCustomer.contacts.length === 0 ? (
                        <EmptyState message="No contacts have been saved for this customer yet." />
                    ) : (
                        <DataTable
                            columns={[
                                { header: "Name", render: (row) => row.fullName || "Not available" },
                                { header: "Title", render: (row) => row.title || "Not available" },
                                { header: "Email", render: (row) => row.email || "Not available" },
                                {
                                    header: "Phone",
                                    render: (row) =>
                                        row.mainPhone
                                            ? `${row.mainPhone}${row.extension ? ` x${row.extension}` : ""}`
                                            : "Not available",
                                },
                                { header: "Cell", render: (row) => row.cellPhone || "—" },
                                { header: "Role / Permission", render: (row) => row.permissionRole || "—" },
                                { header: "Decision Priority", render: (row) => row.decisionPriority || "—" },
                                { header: "Source", render: (row) => row.contactSource || "—" },
                            ]}
                            rows={selectedCustomer.contacts}
                            keyExtractor={(row, index) => `${row.email || row.fullName}-${index}`}
                        />
                    )}
                </SectionCard>

                <SectionCard title="Linked Deployment Licenses">
                    {!selectedCustomer ? (
                        <EmptyState message="Select a customer to review linked deployments." />
                    ) : selectedCustomer.deployments.length === 0 ? (
                        <EmptyState message="No deployment licenses are linked yet." />
                    ) : (
                        <DataTable
                            columns={[
                                { header: "License ID", render: (row) => row.licenseId || "Not available" },
                                { header: "Service", render: (row) => row.serviceName || "Not available" },
                                { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                            ]}
                            rows={selectedCustomer.deployments}
                            keyExtractor={(row, index) => `${row.licenseId || row.serviceName}-${index}`}
                        />
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Linked Connector Licenses">
                {!selectedCustomer ? (
                    <EmptyState message="Select a customer to review linked connectors." />
                ) : selectedCustomer.connectors.length === 0 ? (
                    <EmptyState message="No connector licenses are linked yet." />
                ) : (
                    <DataTable
                        columns={[
                            { header: "License ID", render: (row) => row.licenseId || "Not available" },
                            { header: "Connector", render: (row) => row.connectorName || "Not available" },
                            { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                        ]}
                        rows={selectedCustomer.connectors}
                        keyExtractor={(row, index) => `${row.licenseId || row.connectorName}-${index}`}
                    />
                )}
            </SectionCard>
        </>
    );
}