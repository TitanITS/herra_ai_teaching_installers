import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    createCustomerDeploymentBootstrap,
    getCustomerDeployment,
    getCustomerDeploymentEvents,
    getCustomerDeploymentHealth,
    getCustomerDeploymentProvisioning,
    launchCustomerDeployment,
} from "../../../api/deployments";
import type {
    CustomerDeploymentProvisioningSummary,
    DeploymentEventRecord,
    DeploymentHealthRecord,
    DeploymentRecord,
    ProvisioningBootstrapResponse,
} from "../../../types/deployments";

type SlotSelectionMap = Record<number, number>;

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
}

function formatStatusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildInitialSelections(provisioningData: CustomerDeploymentProvisioningSummary): SlotSelectionMap {
    const nextSelections: SlotSelectionMap = {};

    for (const slot of provisioningData.connector_slots) {
        if (slot.release_id) {
            nextSelections[slot.slot_id] = slot.release_id;
            continue;
        }

        const preferredWindowsRelease = provisioningData.connector_releases.find(
            (release) => release.operating_system === "windows" && release.architecture === "x64",
        );

        if (preferredWindowsRelease) {
            nextSelections[slot.slot_id] = preferredWindowsRelease.id;
            continue;
        }

        if (provisioningData.connector_releases.length > 0) {
            nextSelections[slot.slot_id] = provisioningData.connector_releases[0].id;
        }
    }

    return nextSelections;
}

export default function DeploymentPage() {
    const { token } = useAuth();

    const [deployment, setDeployment] = useState<DeploymentRecord | null>(null);
    const [health, setHealth] = useState<DeploymentHealthRecord | null>(null);
    const [events, setEvents] = useState<DeploymentEventRecord[]>([]);
    const [provisioning, setProvisioning] = useState<CustomerDeploymentProvisioningSummary | null>(null);
    const [selectedReleaseBySlot, setSelectedReleaseBySlot] = useState<SlotSelectionMap>({});
    const [latestBootstrap, setLatestBootstrap] = useState<ProvisioningBootstrapResponse | null>(null);
    const [launchUrl, setLaunchUrl] = useState<string>("");
    const [issuingSlotId, setIssuingSlotId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const loadData = async () => {
        if (!token) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const [deploymentData, healthData, eventData, provisioningData, launchData] = await Promise.all([
                getCustomerDeployment(token),
                getCustomerDeploymentHealth(token),
                getCustomerDeploymentEvents(token),
                getCustomerDeploymentProvisioning(token),
                launchCustomerDeployment(token),
            ]);

            const typedDeployment = deploymentData as DeploymentRecord;
            const typedHealth = healthData as DeploymentHealthRecord;
            const typedEvents = (eventData as DeploymentEventRecord[]) ?? [];
            const typedProvisioning = provisioningData as CustomerDeploymentProvisioningSummary;

            setDeployment(typedDeployment);
            setHealth(typedHealth);
            setEvents(typedEvents);
            setProvisioning(typedProvisioning);
            setSelectedReleaseBySlot(buildInitialSelections(typedProvisioning));
            setLaunchUrl(launchData?.launch_url ?? "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load deployment.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const releaseLookup = useMemo(() => {
        const map = new Map<number, CustomerDeploymentProvisioningSummary["connector_releases"][number]>();

        if (!provisioning) {
            return map;
        }

        for (const release of provisioning.connector_releases) {
            map.set(release.id, release);
        }

        return map;
    }, [provisioning]);

    const handleReleaseChange = (slotId: number, releaseId: number) => {
        setSelectedReleaseBySlot((current) => ({
            ...current,
            [slotId]: releaseId,
        }));
    };

    const handleIssueBootstrap = async (slotId: number) => {
        if (!token || !provisioning) {
            return;
        }

        const slot = provisioning.connector_slots.find((item) => item.slot_id === slotId);
        if (!slot) {
            setError("Connector slot was not found.");
            return;
        }

        const releaseId = selectedReleaseBySlot[slotId];
        if (!releaseId) {
            setError("Please choose an installer release before creating a bootstrap token.");
            return;
        }

        setError("");
        setMessage("");
        setIssuingSlotId(slotId);

        try {
            const response = await createCustomerDeploymentBootstrap(token, {
                slot_id: slotId,
                release_id: releaseId,
                expires_minutes: 60,
                connector_name: slot.connector_name,
                site_label: slot.site_label,
            });

            setLatestBootstrap(response);
            setMessage(
                `${response.message} Bootstrap token created for ${response.connector_name}. Copy the token below and use it during connector install.`,
            );

            const refreshedProvisioning = await getCustomerDeploymentProvisioning(token);
            const typedProvisioning = refreshedProvisioning as CustomerDeploymentProvisioningSummary;

            setProvisioning(typedProvisioning);
            setSelectedReleaseBySlot((current) => {
                const next = { ...current };
                next[slotId] = releaseId;
                return next;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create connector bootstrap token.");
        } finally {
            setIssuingSlotId(null);
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Deployment"
                subtitle="View Herra deployment state, health reporting, events, launch access, and Secure Network Connector install readiness."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            {isLoading || !deployment || !health || !provisioning ? (
                <div className="center-message">Loading deployment...</div>
            ) : (
                <>
                    <div className="dashboard-section">
                        <div className="content-grid content-grid--2">
                            <SectionCard title="Deployment Summary">
                                <div className="data-list">
                                    <div className="data-list__row">
                                        <span className="data-list__label">Name</span>
                                        <span className="data-list__value">{deployment.name}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Code</span>
                                        <span className="data-list__value">{deployment.deployment_code}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Status</span>
                                        <StatusBadge status={deployment.status} />
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Version</span>
                                        <span className="data-list__value">{deployment.version}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Region</span>
                                        <span className="data-list__value">{deployment.region}</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Environment</span>
                                        <span className="data-list__value">{deployment.environment_type}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: "18px" }}>
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
                            </SectionCard>

                            <SectionCard title="Deployment Health">
                                <div className="data-list">
                                    <div className="data-list__row">
                                        <span className="data-list__label">Health</span>
                                        <StatusBadge status={health.health_status} />
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">CPU</span>
                                        <span className="data-list__value">{health.cpu_percent}%</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Memory</span>
                                        <span className="data-list__value">{health.memory_percent}%</span>
                                    </div>

                                    <div className="data-list__row">
                                        <span className="data-list__label">Last Report</span>
                                        <span className="data-list__value">{health.last_reported_at}</span>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <SectionCard title="Secure Network Connector Provisioning">
                            <div className="data-list">
                                <div className="data-list__row">
                                    <span className="data-list__label">Deployment</span>
                                    <span className="data-list__value">{provisioning.deployment_name}</span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Included Connectors</span>
                                    <span className="data-list__value">{provisioning.included_connector_count}</span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Additional Connectors</span>
                                    <span className="data-list__value">{provisioning.additional_connector_count}</span>
                                </div>

                                <div className="data-list__row">
                                    <span className="data-list__label">Total Connector Slots</span>
                                    <span className="data-list__value">{provisioning.total_connector_count}</span>
                                </div>
                            </div>

                            {latestBootstrap ? (
                                <div
                                    style={{
                                        marginTop: "18px",
                                        padding: "16px",
                                        borderRadius: "14px",
                                        border: "1px solid rgba(114, 183, 255, 0.18)",
                                        background: "rgba(8, 20, 39, 0.45)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.95rem",
                                            fontWeight: 700,
                                            marginBottom: "12px",
                                        }}
                                    >
                                        Latest Bootstrap Token
                                    </div>

                                    <div className="data-list">
                                        <div className="data-list__row">
                                            <span className="data-list__label">Connector</span>
                                            <span className="data-list__value">{latestBootstrap.connector_name}</span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Label</span>
                                            <span className="data-list__value">{latestBootstrap.bootstrap_label}</span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Expires</span>
                                            <span className="data-list__value">
                                                {formatDateTime(latestBootstrap.bootstrap_expires_at)}
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Installer</span>
                                            <span className="data-list__value">{latestBootstrap.installer_filename}</span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Bootstrap Token</span>
                                            <span
                                                className="data-list__value"
                                                style={{
                                                    fontFamily: "monospace",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {latestBootstrap.bootstrap_token}
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Download</span>
                                            <span className="data-list__value">
                                                <a
                                                    href={latestBootstrap.installer_download_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {latestBootstrap.installer_download_url}
                                                </a>
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Install Notes</span>
                                            <span className="data-list__value">{latestBootstrap.install_notes}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div
                                style={{
                                    marginTop: "18px",
                                    maxHeight: "420px",
                                    overflowY: "auto",
                                    overflowX: "auto",
                                    border: "1px solid rgba(114, 183, 255, 0.12)",
                                    borderRadius: "14px",
                                    background: "rgba(8, 20, 39, 0.45)",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        minWidth: "1180px",
                                    }}
                                >
                                    <thead
                                        style={{
                                            position: "sticky",
                                            top: 0,
                                            zIndex: 1,
                                            background: "rgba(8, 20, 39, 0.96)",
                                        }}
                                    >
                                        <tr>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "14%",
                                                }}
                                            >
                                                Connector
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "12%",
                                                }}
                                            >
                                                Site
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "10%",
                                                }}
                                            >
                                                Plan Status
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "10%",
                                                }}
                                            >
                                                Provisioning
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "19%",
                                                }}
                                            >
                                                Installer Release
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "18%",
                                                }}
                                            >
                                                Installer Details
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "14px 16px",
                                                    color: "var(--titan-text-soft)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    width: "17%",
                                                }}
                                            >
                                                Bootstrap
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {provisioning.connector_slots.map((slot) => {
                                            const selectedReleaseId = selectedReleaseBySlot[slot.slot_id];
                                            const selectedRelease = selectedReleaseId
                                                ? releaseLookup.get(selectedReleaseId) ?? null
                                                : null;

                                            return (
                                                <tr key={slot.slot_id}>
                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        <div>{slot.connector_name}</div>
                                                        <div
                                                            style={{
                                                                color: "var(--titan-text-soft)",
                                                                marginTop: "4px",
                                                                fontSize: "0.9rem",
                                                            }}
                                                        >
                                                            Slot #{slot.slot_id}
                                                        </div>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        {slot.site_label}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        <div>{slot.included_in_plan ? "Included" : "Additional"}</div>
                                                        <div
                                                            style={{
                                                                color: "var(--titan-text-soft)",
                                                                marginTop: "4px",
                                                            }}
                                                        >
                                                            {formatStatusLabel(slot.status)}
                                                        </div>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        <div>{formatStatusLabel(slot.bootstrap_status)}</div>
                                                        <div
                                                            style={{
                                                                color: "var(--titan-text-soft)",
                                                                marginTop: "4px",
                                                            }}
                                                        >
                                                            Last issued: {formatDateTime(slot.last_bootstrap_created_at)}
                                                        </div>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                        }}
                                                    >
                                                        <select
                                                            value={selectedReleaseId ?? ""}
                                                            onChange={(event) =>
                                                                handleReleaseChange(
                                                                    slot.slot_id,
                                                                    Number(event.target.value),
                                                                )
                                                            }
                                                            style={{
                                                                width: "100%",
                                                                minHeight: "42px",
                                                                borderRadius: "10px",
                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                background: "rgba(10, 25, 49, 0.9)",
                                                                color: "var(--titan-text-main)",
                                                                padding: "10px 12px",
                                                            }}
                                                        >
                                                            {provisioning.connector_releases.map((release) => (
                                                                <option key={release.id} value={release.id}>
                                                                    {release.name} - {release.operating_system}{" "}
                                                                    {release.architecture} - v{release.version}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        {selectedRelease ? (
                                                            <>
                                                                <div>{selectedRelease.filename}</div>
                                                                <div
                                                                    style={{
                                                                        color: "var(--titan-text-soft)",
                                                                        marginTop: "4px",
                                                                    }}
                                                                >
                                                                    SHA256: {selectedRelease.checksum_sha256}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        color: "var(--titan-text-soft)",
                                                                        marginTop: "6px",
                                                                    }}
                                                                >
                                                                    {selectedRelease.install_notes}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            "Select a release."
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                        }}
                                                    >
                                                        <button
                                                            className="primary-button"
                                                            type="button"
                                                            onClick={() => void handleIssueBootstrap(slot.slot_id)}
                                                            disabled={issuingSlotId === slot.slot_id}
                                                            style={{
                                                                width: "100%",
                                                                opacity: issuingSlotId === slot.slot_id ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {issuingSlotId === slot.slot_id
                                                                ? "Creating Bootstrap..."
                                                                : "Create Bootstrap"}
                                                        </button>

                                                        {slot.installer_download_url ? (
                                                            <div
                                                                style={{
                                                                    marginTop: "12px",
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                <a
                                                                    href={slot.installer_download_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Current Installer Link
                                                                </a>
                                                            </div>
                                                        ) : null}

                                                        <div
                                                            style={{
                                                                color: "var(--titan-text-soft)",
                                                                marginTop: "10px",
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            Expires: {formatDateTime(slot.last_bootstrap_expires_at)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>

                    <div className="dashboard-section">
                        <SectionCard title="Deployment Events">
                            {events.length === 0 ? (
                                <div className="center-message">No deployment events found.</div>
                            ) : (
                                <div
                                    style={{
                                        maxHeight: "360px",
                                        overflowY: "auto",
                                        overflowX: "auto",
                                        border: "1px solid rgba(114, 183, 255, 0.12)",
                                        borderRadius: "14px",
                                        background: "rgba(8, 20, 39, 0.45)",
                                    }}
                                >
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            minWidth: "760px",
                                        }}
                                    >
                                        <thead
                                            style={{
                                                position: "sticky",
                                                top: 0,
                                                zIndex: 1,
                                                background: "rgba(8, 20, 39, 0.96)",
                                            }}
                                        >
                                            <tr>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "14px 16px",
                                                        color: "var(--titan-text-soft)",
                                                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                        width: "18%",
                                                    }}
                                                >
                                                    Type
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "14px 16px",
                                                        color: "var(--titan-text-soft)",
                                                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                        width: "14%",
                                                    }}
                                                >
                                                    Severity
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "14px 16px",
                                                        color: "var(--titan-text-soft)",
                                                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                        width: "43%",
                                                    }}
                                                >
                                                    Message
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "14px 16px",
                                                        color: "var(--titan-text-soft)",
                                                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                        width: "25%",
                                                    }}
                                                >
                                                    Created At
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {events.map((event: DeploymentEventRecord) => (
                                                <tr key={event.id}>
                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                        }}
                                                    >
                                                        {event.event_type}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                        }}
                                                    >
                                                        {event.severity}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        {event.message}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "14px 16px",
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                            verticalAlign: "top",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {event.created_at}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    </div>
                </>
            )}
        </div>
    );
}