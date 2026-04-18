import { useEffect, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";
import { getCustomerPermissions, getCustomerRoles } from "../../../api/roles";

type RoleRecord = {
    name: string;
    permissions: string[];
};

type PermissionRecord = {
    code: string;
};

export default function RolesPermissionsPage() {
    const { token } = useAuth();
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const loadData = async () => {
            if (!token) return;

            setIsLoading(true);
            setError("");

            try {
                const [roleData, permissionData] = await Promise.all([
                    getCustomerRoles(token),
                    getCustomerPermissions(token),
                ]);
                setRoles(roleData);
                setPermissions(permissionData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load role data.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [token]);

    return (
        <>
            <PageHeader
                title="Roles & Permissions"
                subtitle="Review customer roles and the exact permission mappings enforced by Titan."
            />

            {error ? <div className="error-banner">{error}</div> : null}

            <div className="two-column-grid">
                <SectionCard title="Available Customer Permissions">
                    {isLoading ? (
                        <div className="center-message">Loading permissions...</div>
                    ) : (
                        <div className="pill-list">
                            {permissions.map((permission) => (
                                <span key={permission.code} className="pill-item">
                                    {permission.code}
                                </span>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="RBAC Notes">
                    <p className="card-copy">
                        Roles are enforced in the backend. Customer Administrator is intentionally blocked from
                        billing, and permissions are merged when a user has multiple roles.
                    </p>
                </SectionCard>
            </div>

            <SectionCard title="Customer Role Matrix">
                {isLoading ? (
                    <div className="center-message">Loading roles...</div>
                ) : (
                    <div className="role-stack">
                        {roles.map((role) => (
                            <div key={role.name} className="role-card">
                                <h3>{role.name}</h3>
                                <div className="pill-list">
                                    {role.permissions.map((permission) => (
                                        <span key={permission} className="pill-item">
                                            {permission}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </>
    );
}