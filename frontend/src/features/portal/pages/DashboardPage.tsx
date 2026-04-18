import { useEffect, useState } from "react";
import { launchCustomerDeployment } from "../../../api/deployments";
import { useAuth } from "../../../hooks/auth/useAuth";
import { useCustomerAccount } from "../../../hooks/portal/useCustomerAccount";

export default function DashboardPage() {
    const { account } = useCustomerAccount();
    const { token } = useAuth();

    const [launchUrl, setLaunchUrl] = useState<string>("");
    const [launchError, setLaunchError] = useState<string>("");

    useEffect(() => {
        const loadLaunchUrl = async () => {
            if (!token) {
                return;
            }

            try {
                setLaunchError("");
                const response = await launchCustomerDeployment(token);
                setLaunchUrl(response?.launch_url ?? "");
            } catch (err) {
                setLaunchUrl("");
                setLaunchError(err instanceof Error ? err.message : "Failed to load Herra launch link.");
            }
        };

        void loadLaunchUrl();
    }, [token]);

    return (
        <div className="page-container dashboard-page">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                }}
            >
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Dashboard</h1>
                    <p>
                        Your Titan customer control center for account access, deployment visibility,
                        connector health, and Herra launch.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", minHeight: "44px" }}>
                    {launchUrl ? (
                        <a
                            className="primary-button button-link"
                            href={launchUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Launch Herra
                        </a>
                    ) : (
                        <button className="primary-button" type="button" disabled style={{ opacity: 0.7 }}>
                            Launch Herra
                        </button>
                    )}
                </div>
            </div>

            {launchError ? <div className="error-banner">{launchError}</div> : null}

            <div className="dashboard-section">
                <div className="content-grid content-grid--4">
                    <div className="stat-card">
                        <div className="stat-card__label">Tokens Purchased</div>
                        <div className="stat-card__value">100,000</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card__label">Tokens Used</div>
                        <div className="stat-card__value">18,320</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card__label">Tokens Remaining</div>
                        <div className="stat-card__value">81,680</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card__label">Connector Health</div>
                        <div className="stat-card__value">3/4</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="content-grid content-grid--3">
                    <div className="section-card dashboard-card">
                        <h3 className="section-card__title">Token Usage</h3>
                        <div className="data-list">
                            <div className="data-list__row">
                                <span className="data-list__label">Purchased</span>
                                <span className="data-list__value">100,000</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Used</span>
                                <span className="data-list__value">18,320</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Remaining</span>
                                <span className="data-list__value">81,680</span>
                            </div>
                        </div>
                    </div>

                    <div className="section-card dashboard-card">
                        <h3 className="section-card__title">Deployment Status</h3>
                        <div className="data-list">
                            <div className="data-list__row">
                                <span className="data-list__label">Status</span>
                                <span className="status-badge status-badge--active">active</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Version</span>
                                <span className="data-list__value">Herra v1.0.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="section-card dashboard-card">
                        <h3 className="section-card__title">Billing Snapshot</h3>
                        <div className="data-list">
                            <div className="data-list__row">
                                <span className="data-list__label">Estimated Monthly Billing</span>
                                <span className="data-list__value">$249.99</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="content-grid content-grid--2">
                    <div className="section-card dashboard-card">
                        <h3 className="section-card__title">Account Manager</h3>
                        <div className="data-list">
                            <div className="data-list__row">
                                <span className="data-list__label">Name</span>
                                <span className="data-list__value">Jordan Ellis</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Title</span>
                                <span className="data-list__value">Account Manager</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Email</span>
                                <span className="data-list__value">jordan.ellis@titan.local</span>
                            </div>
                            <div className="data-list__row">
                                <span className="data-list__label">Phone</span>
                                <span className="data-list__value">1-800-555-0100</span>
                            </div>
                        </div>
                    </div>

                    <div className="section-card dashboard-card">
                        <h3 className="section-card__title">Customer Summary</h3>
                        <p className="dashboard-card__copy">
                            {(account?.company_name || "Demo Customer")} is active and operating in{" "}
                            <strong>{account?.timezone || "America/New_York"}</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}