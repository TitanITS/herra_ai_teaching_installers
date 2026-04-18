import { useEffect, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    getCustomerSettings,
    updateCustomerSettingsNotifications,
    updateCustomerSettingsOrganization,
    updateCustomerSettingsPreferences,
} from "../../../api/settings";

type SettingsData = {
    organization: {
        company_name: string;
        primary_contact_name: string;
        primary_contact_email: string;
        billing_contact_email: string;
        technical_contact_email: string;
        timezone: string;
    };
    security: {
        mfa_enabled: boolean;
        last_login_at: string;
        active_session_label: string;
        password_reset_available: boolean;
    };
    notifications: {
        billing_notices: boolean;
        support_case_updates: boolean;
        deployment_alerts: boolean;
        connector_health_alerts: boolean;
    };
    preferences: {
        default_landing_page: string;
        date_format: string;
        time_format: string;
    };
};

const fieldWrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const fieldLabelStyle: React.CSSProperties = {
    color: "var(--titan-text)",
    fontWeight: 600,
    fontSize: "0.95rem",
};

const fieldInputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "46px",
    padding: "0 14px",
    borderRadius: "14px",
    border: "1px solid rgba(114, 183, 255, 0.25)",
    background: "rgba(12, 28, 54, 0.96)",
    color: "#ffffff",
    outline: "none",
};

const fieldReadOnlyStyle: React.CSSProperties = {
    ...fieldInputStyle,
    opacity: 0.72,
    cursor: "default",
};

const toggleRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
};

function formatNotificationLabel(key: string): string {
    return key
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function SettingsPage() {
    const { token } = useAuth();

    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [organization, setOrganization] = useState<SettingsData["organization"] | null>(null);
    const [notifications, setNotifications] = useState<SettingsData["notifications"] | null>(null);
    const [preferences, setPreferences] = useState<SettingsData["preferences"] | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [isEditingOrganization, setIsEditingOrganization] = useState(false);
    const [isEditingNotifications, setIsEditingNotifications] = useState(false);
    const [isEditingPreferences, setIsEditingPreferences] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            if (!token) {
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const result = await getCustomerSettings(token);
                setSettings(result);
                setOrganization(result.organization);
                setNotifications(result.notifications);
                setPreferences(result.preferences);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load settings.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadSettings();
    }, [token]);

    const handleSaveOrganization = async () => {
        if (!token || !organization) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const result = await updateCustomerSettingsOrganization(token, organization);
            setMessage(result.message);
            const refreshed = await getCustomerSettings(token);
            setSettings(refreshed);
            setOrganization(refreshed.organization);
            setIsEditingOrganization(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save organization settings.");
        }
    };

    const handleSaveNotifications = async () => {
        if (!token || !notifications) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const result = await updateCustomerSettingsNotifications(token, notifications);
            setMessage(result.message);
            const refreshed = await getCustomerSettings(token);
            setSettings(refreshed);
            setNotifications(refreshed.notifications);
            setIsEditingNotifications(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save notification settings.");
        }
    };

    const handleSavePreferences = async () => {
        if (!token || !preferences) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const result = await updateCustomerSettingsPreferences(token, preferences);
            setMessage(result.message);
            const refreshed = await getCustomerSettings(token);
            setSettings(refreshed);
            setPreferences(refreshed.preferences);
            setIsEditingPreferences(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save portal preferences.");
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Settings"
                subtitle="Manage organization details, security visibility, notifications, and customer portal preferences."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading || !settings || !organization || !notifications || !preferences ? (
                <div className="center-message">Loading settings...</div>
            ) : (
                <>
                    <div className="content-grid content-grid--2">
                        <SectionCard title="Organization">
                            <div className="content-grid content-grid--2">
                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Company Name</span>
                                    <input
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        type="text"
                                        value={organization.company_name}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                company_name: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Time Zone</span>
                                    <select
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        value={organization.timezone}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                timezone: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="America/New_York" style={{ background: "#0c1c36" }}>
                                            America/New_York
                                        </option>
                                        <option value="America/Chicago" style={{ background: "#0c1c36" }}>
                                            America/Chicago
                                        </option>
                                        <option value="America/Denver" style={{ background: "#0c1c36" }}>
                                            America/Denver
                                        </option>
                                        <option value="America/Los_Angeles" style={{ background: "#0c1c36" }}>
                                            America/Los_Angeles
                                        </option>
                                    </select>
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Primary Contact Name</span>
                                    <input
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        type="text"
                                        value={organization.primary_contact_name}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                primary_contact_name: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Primary Contact Email</span>
                                    <input
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        type="email"
                                        value={organization.primary_contact_email}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                primary_contact_email: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Billing Contact Email</span>
                                    <input
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        type="email"
                                        value={organization.billing_contact_email}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                billing_contact_email: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Technical Contact Email</span>
                                    <input
                                        style={isEditingOrganization ? fieldInputStyle : fieldReadOnlyStyle}
                                        type="email"
                                        value={organization.technical_contact_email}
                                        disabled={!isEditingOrganization}
                                        onChange={(event) =>
                                            setOrganization({
                                                ...organization,
                                                technical_contact_email: event.target.value,
                                            })
                                        }
                                    />
                                </label>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "18px",
                                }}
                            >
                                {isEditingOrganization ? (
                                    <button className="primary-button" type="button" onClick={handleSaveOrganization}>
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        className="primary-button"
                                        type="button"
                                        onClick={() => setIsEditingOrganization(true)}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Security">
                            <div className="data-list">
                                <div className="data-list__row">
                                    <span className="data-list__label">MFA Status</span>
                                    <span className="data-list__value">
                                        {settings.security.mfa_enabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Last Login</span>
                                    <span className="data-list__value">{settings.security.last_login_at}</span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Active Session</span>
                                    <span className="data-list__value">{settings.security.active_session_label}</span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Password Reset</span>
                                    <span className="data-list__value">
                                        {settings.security.password_reset_available
                                            ? "Available"
                                            : "Future Phase"}
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    marginTop: "18px",
                                    padding: "14px 16px",
                                    borderRadius: "14px",
                                    border: "1px solid rgba(114, 183, 255, 0.16)",
                                    background: "rgba(12, 28, 54, 0.62)",
                                    color: "var(--titan-text-soft)",
                                    lineHeight: 1.6,
                                }}
                            >
                                Security actions such as password reset flow and session management will be expanded
                                in a later phase after the customer portal settings foundation is locked.
                            </div>
                        </SectionCard>
                    </div>

                    <div className="content-grid content-grid--2">
                        <SectionCard title="Notifications">
                            <div>
                                <div style={toggleRowStyle}>
                                    <span>Billing Notices</span>
                                    <input
                                        type="checkbox"
                                        disabled={!isEditingNotifications}
                                        checked={notifications.billing_notices}
                                        onChange={(event) =>
                                            setNotifications({
                                                ...notifications,
                                                billing_notices: event.target.checked,
                                            })
                                        }
                                    />
                                </div>

                                <div style={toggleRowStyle}>
                                    <span>Support Case Updates</span>
                                    <input
                                        type="checkbox"
                                        disabled={!isEditingNotifications}
                                        checked={notifications.support_case_updates}
                                        onChange={(event) =>
                                            setNotifications({
                                                ...notifications,
                                                support_case_updates: event.target.checked,
                                            })
                                        }
                                    />
                                </div>

                                <div style={toggleRowStyle}>
                                    <span>Deployment Alerts</span>
                                    <input
                                        type="checkbox"
                                        disabled={!isEditingNotifications}
                                        checked={notifications.deployment_alerts}
                                        onChange={(event) =>
                                            setNotifications({
                                                ...notifications,
                                                deployment_alerts: event.target.checked,
                                            })
                                        }
                                    />
                                </div>

                                <div style={{ ...toggleRowStyle, borderBottom: "none" }}>
                                    <span>Connector Health Alerts</span>
                                    <input
                                        type="checkbox"
                                        disabled={!isEditingNotifications}
                                        checked={notifications.connector_health_alerts}
                                        onChange={(event) =>
                                            setNotifications({
                                                ...notifications,
                                                connector_health_alerts: event.target.checked,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "18px",
                                }}
                            >
                                {isEditingNotifications ? (
                                    <button className="primary-button" type="button" onClick={handleSaveNotifications}>
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        className="primary-button"
                                        type="button"
                                        onClick={() => setIsEditingNotifications(true)}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Portal Preferences">
                            <div className="content-grid content-grid--2">
                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Default Landing Page</span>
                                    <select
                                        style={isEditingPreferences ? fieldInputStyle : fieldReadOnlyStyle}
                                        value={preferences.default_landing_page}
                                        disabled={!isEditingPreferences}
                                        onChange={(event) =>
                                            setPreferences({
                                                ...preferences,
                                                default_landing_page: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="dashboard" style={{ background: "#0c1c36" }}>
                                            Dashboard
                                        </option>
                                        <option value="support" style={{ background: "#0c1c36" }}>
                                            Support
                                        </option>
                                        <option value="deployments" style={{ background: "#0c1c36" }}>
                                            Deployment
                                        </option>
                                        <option value="connectors" style={{ background: "#0c1c36" }}>
                                            Secure Network Connectors
                                        </option>
                                        <option value="billing" style={{ background: "#0c1c36" }}>
                                            Billing
                                        </option>
                                    </select>
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Date Format</span>
                                    <select
                                        style={isEditingPreferences ? fieldInputStyle : fieldReadOnlyStyle}
                                        value={preferences.date_format}
                                        disabled={!isEditingPreferences}
                                        onChange={(event) =>
                                            setPreferences({
                                                ...preferences,
                                                date_format: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="MM/DD/YYYY" style={{ background: "#0c1c36" }}>
                                            MM/DD/YYYY
                                        </option>
                                        <option value="DD/MM/YYYY" style={{ background: "#0c1c36" }}>
                                            DD/MM/YYYY
                                        </option>
                                        <option value="YYYY-MM-DD" style={{ background: "#0c1c36" }}>
                                            YYYY-MM-DD
                                        </option>
                                    </select>
                                </label>

                                <label style={fieldWrapStyle}>
                                    <span style={fieldLabelStyle}>Time Format</span>
                                    <select
                                        style={isEditingPreferences ? fieldInputStyle : fieldReadOnlyStyle}
                                        value={preferences.time_format}
                                        disabled={!isEditingPreferences}
                                        onChange={(event) =>
                                            setPreferences({
                                                ...preferences,
                                                time_format: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="12-hour" style={{ background: "#0c1c36" }}>
                                            12-hour
                                        </option>
                                        <option value="24-hour" style={{ background: "#0c1c36" }}>
                                            24-hour
                                        </option>
                                    </select>
                                </label>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "18px",
                                }}
                            >
                                {isEditingPreferences ? (
                                    <button className="primary-button" type="button" onClick={handleSavePreferences}>
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        className="primary-button"
                                        type="button"
                                        onClick={() => setIsEditingPreferences(true)}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                </>
            )}
        </div>
    );
}