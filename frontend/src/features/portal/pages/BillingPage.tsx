import { useEffect, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    createCustomerBillingPortalSession,
    getCustomerBillingSummary,
} from "../../../api/billing";

type BillingInvoice = {
    invoice_number: string;
    invoice_date: string;
    amount_due: string;
    status: string;
    hosted_invoice_url: string;
    pdf_url: string;
};

type BillingContact = {
    name: string;
    title: string;
    email: string;
    phone: string;
};

type BillingSummary = {
    current_plan: string;
    subscription_status: string;
    billing_period_start: string;
    billing_period_end: string;
    contracted_tokens: number;
    tokens_used: number;
    tokens_remaining: number;
    connector_count: number;
    connector_monthly_rate: string;
    base_monthly_rate: string;
    estimated_monthly_total: string;
    payment_method: {
        brand: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        is_available: boolean;
    };
    billing_contacts: BillingContact[];
    invoices: BillingInvoice[];
};

function formatCardDisplay(summary: BillingSummary["payment_method"]) {
    if (!summary.is_available) {
        return "No payment method on file";
    }

    return `${summary.brand} •••• ${summary.last4}`;
}

function formatExpiration(summary: BillingSummary["payment_method"]) {
    if (!summary.is_available) {
        return "Stripe portal required";
    }

    return `${summary.exp_month}/${summary.exp_year}`;
}

export default function BillingPage() {
    const { token } = useAuth();
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadBilling = async () => {
            if (!token) {
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const result = await getCustomerBillingSummary(token);
                setSummary(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load billing.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadBilling();
    }, [token]);

    const handleManageBilling = async () => {
        if (!token) {
            return;
        }

        setIsLaunchingPortal(true);
        setError("");
        setMessage("");

        try {
            const result = await createCustomerBillingPortalSession(token);
            setMessage("Opening Stripe customer portal...");
            window.open(result.url, "_blank", "noopener,noreferrer");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not open Stripe portal.");
        } finally {
            setIsLaunchingPortal(false);
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Billing"
                subtitle="Review your current plan, payment method, invoice history, token usage, and customer billing contacts."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading || !summary ? (
                <div className="center-message">Loading billing...</div>
            ) : (
                <>
                    <div className="dashboard-section">
                        <div className="content-grid content-grid--4">
                            <div className="stat-card">
                                <div className="stat-card__label">Current Plan</div>
                                <div className="stat-card__value">{summary.current_plan}</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card__label">Subscription Status</div>
                                <div className="stat-card__value">
                                    <StatusBadge status={summary.subscription_status} />
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card__label">Billing Period</div>
                                <div className="stat-card__value">
                                    {summary.billing_period_start} to {summary.billing_period_end}
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card__label">Estimated Total</div>
                                <div className="stat-card__value">{summary.estimated_monthly_total}</div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="content-grid content-grid--2">
                            <SectionCard title="Payment Method">
                                <div className="data-list">
                                    <div className="data-list__row">
                                        <span className="data-list__label">Card</span>
                                        <span className="data-list__value">
                                            {formatCardDisplay(summary.payment_method)}
                                        </span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Expires</span>
                                        <span className="data-list__value">
                                            {formatExpiration(summary.payment_method)}
                                        </span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Portal</span>
                                        <span className="data-list__value">Stripe Customer Portal</span>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginTop: "18px",
                                    }}
                                >
                                    <button
                                        className="primary-button"
                                        type="button"
                                        onClick={handleManageBilling}
                                        disabled={isLaunchingPortal}
                                    >
                                        {isLaunchingPortal ? "Opening..." : "Manage Billing"}
                                    </button>
                                </div>
                            </SectionCard>

                            <SectionCard title="Token Usage and Charges">
                                <div className="data-list">
                                    <div className="data-list__row">
                                        <span className="data-list__label">Contracted Tokens</span>
                                        <span className="data-list__value">
                                            {summary.contracted_tokens.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Tokens Used</span>
                                        <span className="data-list__value">
                                            {summary.tokens_used.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Tokens Remaining</span>
                                        <span className="data-list__value">
                                            {summary.tokens_remaining.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Base Monthly Rate</span>
                                        <span className="data-list__value">{summary.base_monthly_rate}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Connector Count</span>
                                        <span className="data-list__value">{summary.connector_count}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Connector Monthly Rate</span>
                                        <span className="data-list__value">
                                            {summary.connector_monthly_rate}
                                        </span>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="content-grid content-grid--2">
                            <SectionCard title="Invoice History">
                                {summary.invoices.length === 0 ? (
                                    <div className="center-message">
                                        No invoices are available yet. Once Stripe billing activity
                                        begins, invoices will appear here.
                                    </div>
                                ) : (
                                    <div className="table-shell">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Invoice</th>
                                                    <th>Date</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th>View</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary.invoices.map((invoice) => (
                                                    <tr key={invoice.invoice_number}>
                                                        <td>{invoice.invoice_number}</td>
                                                        <td>{invoice.invoice_date}</td>
                                                        <td>{invoice.amount_due}</td>
                                                        <td>{invoice.status}</td>
                                                        <td>
                                                            {invoice.hosted_invoice_url ? (
                                                                <a
                                                                    href={invoice.hosted_invoice_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Open
                                                                </a>
                                                            ) : invoice.pdf_url ? (
                                                                <a
                                                                    href={invoice.pdf_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    PDF
                                                                </a>
                                                            ) : (
                                                                <span style={{ color: "var(--titan-text-soft)" }}>
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>

                            <SectionCard title="Billing Contacts">
                                {summary.billing_contacts.length === 0 ? (
                                    <div className="center-message">No billing contacts available.</div>
                                ) : (
                                    <div style={{ display: "grid", gap: "12px" }}>
                                        {summary.billing_contacts.map((contact) => (
                                            <div
                                                key={`${contact.email}-${contact.name}`}
                                                style={{
                                                    padding: "14px 16px",
                                                    borderRadius: "14px",
                                                    border: "1px solid rgba(114, 183, 255, 0.16)",
                                                    background: "rgba(12, 28, 54, 0.82)",
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                                                    {contact.name}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "var(--titan-text-soft)",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {contact.title}
                                                </div>
                                                <div
                                                    style={{
                                                        color: "var(--titan-text-soft)",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {contact.email}
                                                </div>
                                                <div style={{ color: "var(--titan-text-soft)" }}>
                                                    {contact.phone || "Phone not listed"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}