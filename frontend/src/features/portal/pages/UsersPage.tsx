import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StatusBadge from "../../../components/common/StatusBadge";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
    assignCustomerUserRoles,
    createCustomerUser,
    disableCustomerUser,
    enableCustomerUser,
    getCustomerUsers,
    resendCustomerUserInvite,
} from "../../../api/users";
import { getCustomerRoles } from "../../../api/roles";

type UserRecord = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role_names: string[];
    permissions: string[];
    customer_account_id: number;
    customer_account_name: string;
    is_active: boolean;
    mfa_enabled: boolean;
    invite_pending: boolean;
};

type RoleRecord = {
    name: string;
    permissions: string[];
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

const notesCardStyle: React.CSSProperties = {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
};

const selectorButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "52px",
    padding: "0 16px",
    borderRadius: "14px",
    border: "1px solid rgba(114, 183, 255, 0.25)",
    background: "rgba(12, 28, 54, 0.96)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    fontWeight: 600,
};

const panelStyle: React.CSSProperties = {
    marginTop: "12px",
    border: "1px solid rgba(114, 183, 255, 0.18)",
    borderRadius: "16px",
    background: "rgba(8, 20, 39, 0.82)",
    padding: "14px",
};

const selectorListStyle: React.CSSProperties = {
    marginTop: "12px",
    display: "grid",
    gap: "10px",
    maxHeight: "240px",
    overflowY: "auto",
};

const selectorItemBaseStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    border: "1px solid rgba(114, 183, 255, 0.2)",
    background: "rgba(12, 28, 54, 0.9)",
    color: "#ffffff",
};

const detailGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "22px",
};

const rolePillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid rgba(114, 183, 255, 0.24)",
    background: "rgba(12, 28, 54, 0.92)",
    color: "#ffffff",
    fontSize: "0.9rem",
    fontWeight: 600,
};

export default function UsersPage() {
    const { token } = useAuth();

    const [users, setUsers] = useState<UserRecord[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [error, setError] = useState<string>("");

    const [email, setEmail] = useState("ops.user@democustomer.com");
    const [firstName, setFirstName] = useState("Ops");
    const [lastName, setLastName] = useState("User");
    const [selectedRole, setSelectedRole] = useState("Customer Support Manager");

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
    const [userSearch, setUserSearch] = useState<string>("");

    const [isRoleEditorOpen, setIsRoleEditorOpen] = useState<boolean>(false);
    const [roleEditValue, setRoleEditValue] = useState<string[]>([]);

    const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) ?? null,
        [users, selectedUserId],
    );

    const filteredUsers = useMemo(() => {
        const query = userSearch.trim().toLowerCase();

        if (!query) {
            return users;
        }

        return users.filter((user) => {
            const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
            return (
                fullName.includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.role_names.join(" ").toLowerCase().includes(query)
            );
        });
    }, [users, userSearch]);

    const loadData = async () => {
        if (!token) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const [userData, roleData] = await Promise.all([getCustomerUsers(token), getCustomerRoles(token)]);

            setUsers(userData);
            setRoles(roleData);

            if (roleData.length > 0 && !roleData.find((role: RoleRecord) => role.name === selectedRole)) {
                setSelectedRole(roleData[0].name);
            }

            if (userData.length > 0) {
                setSelectedUserId((current) => current ?? userData[0].id);
            } else {
                setSelectedUserId(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        if (selectedUser) {
            setRoleEditValue(selectedUser.role_names);
        } else {
            setRoleEditValue([]);
        }
    }, [selectedUser]);

    const handleInviteUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            return;
        }

        setIsSubmitting(true);
        setError("");
        setMessage("");

        try {
            const response = await createCustomerUser(token, {
                email,
                first_name: firstName,
                last_name: lastName,
                role_names: [selectedRole],
            });

            setMessage(`${response.message} Invite token: ${response.invite_token}`);
            setEmail("");
            setFirstName("");
            setLastName("");
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create user invite.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (user: UserRecord) => {
        if (!token) {
            return;
        }

        setError("");
        setMessage("");

        try {
            if (user.is_active) {
                const response = await disableCustomerUser(token, user.id);
                setMessage(response.message);
            } else {
                const response = await enableCustomerUser(token, user.id);
                setMessage(response.message);
            }

            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update user status.");
        }
    };

    const handleResendInvite = async (userId: number) => {
        if (!token) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const response = await resendCustomerUserInvite(token, userId);
            setMessage(response.message);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resend invite.");
        }
    };

    const toggleRoleSelection = (roleName: string) => {
        setRoleEditValue((current) =>
            current.includes(roleName)
                ? current.filter((item) => item !== roleName)
                : [...current, roleName],
        );
    };

    const handleManageOrSaveRoles = async () => {
        if (!selectedUser) {
            return;
        }

        if (!isRoleEditorOpen) {
            setIsRoleEditorOpen(true);
            return;
        }

        if (!token) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const updatedUser = await assignCustomerUserRoles(token, selectedUser.id, roleEditValue);
            setMessage(`Roles updated for ${updatedUser.email}.`);
            setIsRoleEditorOpen(false);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update roles.");
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Users"
                subtitle="Invite customer users, manage account access, and assign role combinations from the customer portal."
            />

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            <div className="content-grid content-grid--2">
                <SectionCard title="Add User">
                    <form
                        onSubmit={handleInviteUser}
                        style={{
                            minHeight: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div className="content-grid content-grid--2">
                            <label style={fieldWrapStyle}>
                                <span style={fieldLabelStyle}>Email</span>
                                <input
                                    style={fieldInputStyle}
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </label>

                            <label style={fieldWrapStyle}>
                                <span style={fieldLabelStyle}>First Name</span>
                                <input
                                    style={fieldInputStyle}
                                    type="text"
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    required
                                />
                            </label>

                            <label style={fieldWrapStyle}>
                                <span style={fieldLabelStyle}>Last Name</span>
                                <input
                                    style={fieldInputStyle}
                                    type="text"
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                    required
                                />
                            </label>

                            <label style={fieldWrapStyle}>
                                <span style={fieldLabelStyle}>Initial Role</span>
                                <select
                                    style={fieldInputStyle}
                                    value={selectedRole}
                                    onChange={(event) => setSelectedRole(event.target.value)}
                                >
                                    {roleNames.map((roleName) => (
                                        <option
                                            key={roleName}
                                            value={roleName}
                                            style={{ background: "#0c1c36", color: "#ffffff" }}
                                        >
                                            {roleName}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div
                            style={{
                                marginTop: "34px",
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button className="primary-button" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </form>
                </SectionCard>

                <SectionCard title="User Management Notes">
                    <div style={notesCardStyle}>
                        <div>
                            <p className="dashboard-card__copy" style={{ marginBottom: "16px" }}>
                                Customer accounts are invite-only. New users receive an invite token from the
                                backend foundation until email delivery is connected in a later phase.
                            </p>

                            <p className="dashboard-card__copy" style={{ marginBottom: 0 }}>
                                Users can have multiple roles assigned. Permissions are merged across all
                                assigned roles.
                            </p>
                        </div>

                        <div
                            style={{
                                marginTop: "20px",
                                padding: "14px 16px",
                                borderRadius: "14px",
                                border: "1px solid rgba(114, 183, 255, 0.18)",
                                background: "rgba(12, 28, 54, 0.6)",
                                color: "var(--titan-text-soft)",
                                lineHeight: 1.6,
                            }}
                        >
                            Use the selector below to review one user at a time, then update roles and access
                            cleanly.
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Users">
                {isLoading ? (
                    <div className="center-message">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="center-message">No users found.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        <div style={panelStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "16px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1.02rem", marginBottom: "4px" }}>
                                        Selected User
                                    </div>
                                    <div style={{ color: "var(--titan-text-soft)" }}>
                                        {selectedUser
                                            ? `${selectedUser.first_name} ${selectedUser.last_name}`
                                            : "No user selected"}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    style={selectorButtonStyle}
                                    onClick={() => setIsSelectorOpen((current) => !current)}
                                >
                                    <span>
                                        {selectedUser
                                            ? `${selectedUser.first_name} ${selectedUser.last_name}`
                                            : "Choose User"}
                                    </span>
                                    <span>{isSelectorOpen ? "▲" : "▼"}</span>
                                </button>
                            </div>

                            {isSelectorOpen ? (
                                <div style={panelStyle}>
                                    <input
                                        style={fieldInputStyle}
                                        type="text"
                                        placeholder="Search user by name, email, or role"
                                        value={userSearch}
                                        onChange={(event) => setUserSearch(event.target.value)}
                                    />

                                    <div style={selectorListStyle}>
                                        {filteredUsers.map((user) => {
                                            const isSelected = selectedUserId === user.id;

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUserId(user.id);
                                                        setIsSelectorOpen(false);
                                                        setUserSearch("");
                                                        setIsRoleEditorOpen(false);
                                                    }}
                                                    style={{
                                                        ...selectorItemBaseStyle,
                                                        border: isSelected
                                                            ? "1px solid rgba(114, 183, 255, 0.5)"
                                                            : selectorItemBaseStyle.border,
                                                        background: isSelected
                                                            ? "linear-gradient(180deg, #5da8ff, #3573d1)"
                                                            : selectorItemBaseStyle.background,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            gap: "16px",
                                                            alignItems: "center",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                                                                {user.first_name} {user.last_name}
                                                            </div>
                                                            <div style={{ color: "rgba(255,255,255,0.88)" }}>
                                                                {user.email}
                                                            </div>
                                                        </div>

                                                        <StatusBadge
                                                            status={user.is_active ? "active" : "warning"}
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {filteredUsers.length === 0 ? (
                                            <div className="center-message">No matching users found.</div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {selectedUser ? (
                            <div style={detailGridStyle}>
                                <SectionCard title="User Details">
                                    <div className="data-list">
                                        <div className="data-list__row">
                                            <span className="data-list__label">Name</span>
                                            <span className="data-list__value">
                                                {selectedUser.first_name} {selectedUser.last_name}
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Email</span>
                                            <span className="data-list__value">{selectedUser.email}</span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Account</span>
                                            <span className="data-list__value">
                                                {selectedUser.customer_account_name}
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Status</span>
                                            <StatusBadge
                                                status={selectedUser.is_active ? "active" : "warning"}
                                            />
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">Invite</span>
                                            <span className="data-list__value">
                                                {selectedUser.invite_pending ? "Pending" : "Complete"}
                                            </span>
                                        </div>

                                        <div className="data-list__row">
                                            <span className="data-list__label">MFA</span>
                                            <span className="data-list__value">
                                                {selectedUser.mfa_enabled ? "Enabled" : "Not Enabled"}
                                            </span>
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard title="Roles and Access">
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        {selectedUser.role_names.length > 0 ? (
                                            selectedUser.role_names.map((roleName) => (
                                                <span key={roleName} style={rolePillStyle}>
                                                    {roleName}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="center-message">No roles assigned.</span>
                                        )}
                                    </div>

                                    <div className="data-list">
                                        <div className="data-list__row">
                                            <span className="data-list__label">Permissions</span>
                                            <span className="data-list__value">
                                                {selectedUser.permissions.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "12px",
                                            marginTop: "18px",
                                        }}
                                    >
                                        <button
                                            className="ghost-button"
                                            type="button"
                                            onClick={() => handleToggleStatus(selectedUser)}
                                        >
                                            {selectedUser.is_active ? "Disable User" : "Enable User"}
                                        </button>

                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={handleManageOrSaveRoles}
                                        >
                                            {isRoleEditorOpen ? "Save Roles" : "Manage Roles"}
                                        </button>

                                        {selectedUser.invite_pending ? (
                                            <button
                                                className="ghost-button"
                                                type="button"
                                                onClick={() => handleResendInvite(selectedUser.id)}
                                            >
                                                Resend Invite
                                            </button>
                                        ) : null}
                                    </div>

                                    {isRoleEditorOpen ? (
                                        <div style={panelStyle}>
                                            <div
                                                style={{
                                                    marginBottom: "12px",
                                                    fontWeight: 700,
                                                    fontSize: "0.98rem",
                                                }}
                                            >
                                                Assign Roles
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: "10px",
                                                    maxHeight: "260px",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                {roleNames.map((roleName) => {
                                                    const isChecked = roleEditValue.includes(roleName);

                                                    return (
                                                        <label
                                                            key={roleName}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "12px",
                                                                padding: "12px 14px",
                                                                borderRadius: "14px",
                                                                border: "1px solid rgba(114, 183, 255, 0.2)",
                                                                background: "rgba(12, 28, 54, 0.92)",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleRoleSelection(roleName)}
                                                            />
                                                            <span>{roleName}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    marginTop: "14px",
                                                }}
                                            >
                                                <button
                                                    className="ghost-button"
                                                    type="button"
                                                    onClick={() => {
                                                        setIsRoleEditorOpen(false);
                                                        setRoleEditValue(selectedUser.role_names);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </SectionCard>
                            </div>
                        ) : null}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}