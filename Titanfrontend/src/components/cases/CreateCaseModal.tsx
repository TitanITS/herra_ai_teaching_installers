import { useEffect, useMemo, useRef, useState } from "react";
import { createPlatformCase } from "../../api/cases";
import { getPlatformCustomerDetail, getPlatformCustomers } from "../../api/customers";
import { useAuth } from "../../hooks/auth/useAuth";
import type { PlatformCaseDetail } from "../../types/cases";
import type { PlatformCustomerContact, PlatformCustomerDetail, PlatformCustomerListItem } from "../../types/customers";

type CreateCaseModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (createdCase: PlatformCaseDetail) => void;
};

const ISSUE_TYPE_OPTIONS = ["Herra Operation Issue", "Connector Issue"] as const;
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"] as const;
const ESCALATION_TARGET_OPTIONS = ["", "Engineer", "Programmer", "Account Manager"] as const;

function buildContactPhone(contact: PlatformCustomerContact) {
    const mainPhone = (contact.main_phone || "").trim();
    const extension = (contact.extension || "").trim();

    if (mainPhone && extension) {
        return `${mainPhone} ext ${extension}`;
    }

    return mainPhone;
}

function buildContactDisplay(contact: PlatformCustomerContact) {
    const name = (contact.full_name || "").trim();
    const email = (contact.email || "").trim();

    if (name && email) {
        return `${name} • ${email}`;
    }

    return name || email;
}

function fixedTextareaStyle() {
    return {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(110, 168, 254, 0.2)",
        background: "rgba(7, 23, 52, 0.82)",
        color: "var(--titan-text)",
        resize: "none" as const,
        height: 240,
        minHeight: 240,
        maxHeight: 240,
        overflowY: "auto" as const,
    };
}

function comboInputStyle() {
    return {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(110, 168, 254, 0.2)",
        background: "rgba(7, 23, 52, 0.82)",
        color: "var(--titan-text)",
    };
}

function comboMenuStyle() {
    return {
        position: "absolute" as const,
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 30,
        border: "1px solid rgba(110, 168, 254, 0.14)",
        borderRadius: 14,
        background: "rgba(8, 21, 48, 0.98)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
        maxHeight: 220,
        overflowY: "auto" as const,
    };
}

export default function CreateCaseModal({ isOpen, onClose, onCreated }: CreateCaseModalProps) {
    const { token } = useAuth();

    const [customers, setCustomers] = useState<PlatformCustomerListItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<PlatformCustomerDetail | null>(null);

    const [customerInputValue, setCustomerInputValue] = useState("");
    const [contactInputValue, setContactInputValue] = useState("");

    const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
    const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);

    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    const [issueType, setIssueType] = useState<(typeof ISSUE_TYPE_OPTIONS)[number]>("Herra Operation Issue");
    const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
    const [escalationTarget, setEscalationTarget] = useState("");
    const [summary, setSummary] = useState("");
    const [caseDetails, setCaseDetails] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = useState(false);

    const customerBoxRef = useRef<HTMLDivElement | null>(null);
    const contactBoxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            if (customerBoxRef.current && !customerBoxRef.current.contains(target)) {
                setIsCustomerMenuOpen(false);
            }

            if (contactBoxRef.current && !contactBoxRef.current.contains(target)) {
                setIsContactMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isOpen || typeof token !== "string" || token.trim() === "") {
            return;
        }

        const authToken: string = token;
        let isMounted = true;

        async function loadCustomers() {
            setIsLoadingCustomers(true);
            setErrorMessage("");

            try {
                const response = await getPlatformCustomers(authToken);

                if (!isMounted) {
                    return;
                }

                const sorted = [...response].sort((left, right) => left.display_name.localeCompare(right.display_name));
                setCustomers(sorted);
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : "Failed to load customers.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCustomers(false);
                }
            }
        }

        void loadCustomers();

        return () => {
            isMounted = false;
        };
    }, [isOpen, token]);

    useEffect(() => {
        if (!isOpen || typeof token !== "string" || token.trim() === "" || selectedCustomerId <= 0) {
            setSelectedCustomerDetail(null);
            return;
        }

        const authToken: string = token;
        let isMounted = true;

        async function loadCustomerDetail() {
            setIsLoadingCustomerDetail(true);
            setErrorMessage("");

            try {
                const response = await getPlatformCustomerDetail(authToken, selectedCustomerId);

                if (!isMounted) {
                    return;
                }

                setSelectedCustomerDetail(response);
                setContactInputValue("");
                setContactName("");
                setContactEmail("");
                setContactPhone("");
                setIsContactMenuOpen(false);
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : "Failed to load customer contacts.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCustomerDetail(false);
                }
            }
        }

        void loadCustomerDetail();

        return () => {
            isMounted = false;
        };
    }, [isOpen, selectedCustomerId, token]);

    const filteredCustomers = useMemo(() => {
        const query = customerInputValue.trim().toLowerCase();

        if (!query) {
            return customers;
        }

        return customers.filter((item) => {
            return (
                item.display_name.toLowerCase().includes(query) ||
                item.legal_name.toLowerCase().includes(query) ||
                item.primary_contact_name.toLowerCase().includes(query) ||
                item.primary_contact_email.toLowerCase().includes(query)
            );
        });
    }, [customerInputValue, customers]);

    const filteredContacts = useMemo(() => {
        const contacts = selectedCustomerDetail?.contacts ?? [];
        const query = contactInputValue.trim().toLowerCase();

        if (!query) {
            return contacts;
        }

        return contacts.filter((contact) => {
            return contact.full_name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query);
        });
    }, [contactInputValue, selectedCustomerDetail]);

    function resetForm() {
        setSelectedCustomerId(0);
        setSelectedCustomerDetail(null);
        setCustomerInputValue("");
        setContactInputValue("");
        setIsCustomerMenuOpen(false);
        setIsContactMenuOpen(false);
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setIssueType("Herra Operation Issue");
        setPriority("Medium");
        setEscalationTarget("");
        setSummary("");
        setCaseDetails("");
        setErrorMessage("");
        setIsSubmitting(false);
    }

    function handleClose() {
        if (isSubmitting) {
            return;
        }

        resetForm();
        onClose();
    }

    function handleSelectCustomer(customer: PlatformCustomerListItem) {
        setSelectedCustomerId(customer.id);
        setCustomerInputValue(customer.display_name);
        setContactInputValue("");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setSelectedCustomerDetail(null);
        setIsCustomerMenuOpen(false);
        setIsContactMenuOpen(false);
    }

    function handleSelectContact(contact: PlatformCustomerContact) {
        setContactInputValue(buildContactDisplay(contact));
        setContactName(contact.full_name);
        setContactEmail(contact.email);
        setContactPhone(buildContactPhone(contact));
        setIsContactMenuOpen(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (typeof token !== "string" || token.trim() === "") {
            return;
        }

        const authToken: string = token;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const createdCase = await createPlatformCase(authToken, {
                customer_id: selectedCustomerId,
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                issue_type: issueType,
                summary,
                case_details: caseDetails,
                priority,
                escalation_target: escalationTarget,
                submitted_by_type: "Staff",
            });

            resetForm();
            onCreated(createdCase);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to create case.");
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(2, 10, 26, 0.82)",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                overflowY: "auto",
                padding: "40px 20px",
            }}
        >
            <div
                style={{
                    width: "min(1080px, 100%)",
                    borderRadius: 24,
                    border: "1px solid rgba(110, 168, 254, 0.18)",
                    background: "linear-gradient(180deg, rgba(13, 31, 66, 0.98), rgba(6, 18, 43, 0.98))",
                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
                    padding: 24,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 18,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>Create Case</div>
                        <div style={{ color: "var(--titan-text-soft)" }}>
                            Create a support case from anywhere in Titan and continue work from My Page.
                        </div>
                    </div>

                </div>

                {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
                    <div
                        style={{
                            display: "grid",
                            gap: 14,
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        }}
                    >
                        <div ref={customerBoxRef} style={{ position: "relative" }}>
                            <label htmlFor="case-customer" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                Customer
                            </label>
                            <input
                                id="case-customer"
                                type="text"
                                value={customerInputValue}
                                onChange={(event) => {
                                    setCustomerInputValue(event.target.value);
                                    setSelectedCustomerId(0);
                                    setSelectedCustomerDetail(null);
                                    setContactInputValue("");
                                    setContactName("");
                                    setContactEmail("");
                                    setContactPhone("");
                                    setIsCustomerMenuOpen(true);
                                }}
                                onFocus={() => setIsCustomerMenuOpen(true)}
                                placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"}
                                style={comboInputStyle()}
                            />

                            {isCustomerMenuOpen ? (
                                <div style={comboMenuStyle()}>
                                    {isLoadingCustomers ? (
                                        <div style={{ padding: 12, color: "var(--titan-text-soft)" }}>Loading customers...</div>
                                    ) : filteredCustomers.length === 0 ? (
                                        <div style={{ padding: 12, color: "var(--titan-text-soft)" }}>No customers matched your search.</div>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                onClick={() => handleSelectCustomer(customer)}
                                                style={{ width: "100%", textAlign: "left", padding: "12px 14px", border: "none", borderBottom: "1px solid rgba(110, 168, 254, 0.08)", background: "transparent", color: "var(--titan-text)", cursor: "pointer" }}
                                            >
                                                {customer.display_name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div ref={contactBoxRef} style={{ position: "relative" }}>
                            <label htmlFor="case-contact" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                Contact
                            </label>
                            <input
                                id="case-contact"
                                type="text"
                                value={contactInputValue}
                                onChange={(event) => {
                                    setContactInputValue(event.target.value);
                                    setContactName("");
                                    setContactEmail("");
                                    setContactPhone("");
                                    if (selectedCustomerId > 0) {
                                        setIsContactMenuOpen(true);
                                    }
                                }}
                                onFocus={() => {
                                    if (selectedCustomerId > 0) {
                                        setIsContactMenuOpen(true);
                                    }
                                }}
                                placeholder={selectedCustomerId <= 0 ? "Select customer first" : isLoadingCustomerDetail ? "Loading contacts..." : "Select contact"}
                                disabled={selectedCustomerId <= 0 || isLoadingCustomerDetail}
                                style={comboInputStyle()}
                            />

                            {isContactMenuOpen ? (
                                <div style={comboMenuStyle()}>
                                    {isLoadingCustomerDetail ? (
                                        <div style={{ padding: 12, color: "var(--titan-text-soft)" }}>Loading contacts...</div>
                                    ) : filteredContacts.length === 0 ? (
                                        <div style={{ padding: 12, color: "var(--titan-text-soft)" }}>No contacts matched your search.</div>
                                    ) : (
                                        filteredContacts.map((contact) => (
                                            <button
                                                key={`${contact.full_name}-${contact.email}`}
                                                type="button"
                                                onClick={() => handleSelectContact(contact)}
                                                style={{ width: "100%", textAlign: "left", padding: "12px 14px", border: "none", borderBottom: "1px solid rgba(110, 168, 254, 0.08)", background: "transparent", color: "var(--titan-text)", cursor: "pointer" }}
                                            >
                                                {buildContactDisplay(contact)}
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 14,
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                    >
                        <div>
                            <label htmlFor="case-issue-type" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                Issue Type
                            </label>
                            <select id="case-issue-type" value={issueType} onChange={(event) => setIssueType(event.target.value as (typeof ISSUE_TYPE_OPTIONS)[number])} style={comboInputStyle()}>
                                {ISSUE_TYPE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="case-priority" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                Priority
                            </label>
                            <select id="case-priority" value={priority} onChange={(event) => setPriority(event.target.value as (typeof PRIORITY_OPTIONS)[number])} style={comboInputStyle()}>
                                {PRIORITY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="case-escalation-target" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                                Escalation Target
                            </label>
                            <select id="case-escalation-target" value={escalationTarget} onChange={(event) => setEscalationTarget(event.target.value)} style={comboInputStyle()}>
                                <option value="">None</option>
                                {ESCALATION_TARGET_OPTIONS.filter((option) => option).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="case-summary" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                            Summary
                        </label>
                        <input id="case-summary" type="text" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Brief summary of the customer issue" style={comboInputStyle()} />
                    </div>

                    <div>
                        <label htmlFor="case-details" style={{ display: "block", marginBottom: 8, fontSize: 12, textTransform: "uppercase", color: "var(--titan-text-soft)" }}>
                            Case Details
                        </label>
                        <textarea id="case-details" value={caseDetails} onChange={(event) => setCaseDetails(event.target.value)} style={fixedTextareaStyle()} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button type="button" className="primary-button" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-button" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Case"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
