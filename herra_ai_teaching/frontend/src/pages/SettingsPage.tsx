import { useEffect, useMemo, useState } from "react";
import TitanCard from "../components/TitanCard";
import TitanButton from "../components/TitanButton";
import { systemApi } from "../features/system/systemApi";
import type { AiRuntimeProfile, MetaData } from "../features/system/systemTypes";
import {
    countAllowedPermissions,
    countRestrictedPermissions,
    getAllRoleDefinitions,
    getRoleDefinition,
    readSimulatedRole,
    writeSimulatedRole,
    type RoleDefinition,
    type RolePermission,
    type SimulatedRoleKey,
} from "../features/settings/rbacConfig";

type SettingsLoadState =
    | { status: "loading" }
    | { status: "error"; message: string; requestId?: string; partial?: SettingsSuccessState }
    | SettingsSuccessState;

type SettingsSuccessState = {
    status: "success";
    requestId: string;
    meta: MetaData;
    profile: AiRuntimeProfile;
};

function permissionTone(allowed: boolean) {
    return allowed
        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
        : "border-amber-400/25 bg-amber-500/10 text-amber-100";
}

function summaryValueClass(isGood: boolean) {
    return isGood ? "text-white" : "text-slate-300";
}

function formatDateTime(value?: string | null) {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString();
}

function PermissionList({
    title,
    subtitle,
    permissions,
}: {
    title: string;
    subtitle: string;
    permissions: RolePermission[];
}) {
    return (
        <TitanCard title={title} subtitle={subtitle} bodyClassName="p-0">
            <div className="h-[360px] overflow-y-auto px-5 py-4">
                <div className="space-y-3">
                    {permissions.map((permission) => (
                        <div key={permission.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">{permission.label}</div>
                                    <div className="mt-2 text-sm text-slate-300">{permission.description}</div>
                                </div>

                                <span
                                    className={[
                                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                        permissionTone(permission.allowed),
                                    ].join(" ")}
                                >
                                    {permission.allowed ? "Allowed" : "Restricted"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TitanCard>
    );
}

export default function SettingsPage() {
    const [state, setState] = useState<SettingsLoadState>({ status: "loading" });
    const [roleKey, setRoleKey] = useState<SimulatedRoleKey>(readSimulatedRole());
    const [message, setMessage] = useState<string>("");

    async function load() {
        setState({ status: "loading" });

        const [metaRes, profileRes] = await Promise.all([
            systemApi.meta(),
            systemApi.aiRuntimeProfile(),
        ]);

        const partial: SettingsSuccessState = {
            status: "success",
            requestId: profileRes.meta?.request_id ?? metaRes.meta?.request_id ?? "unknown",
            meta: metaRes.success
                ? metaRes.data
                : {
                    app_name: "Herra AI Teaching API",
                    app_version: "unknown",
                    env: "unknown",
                    features: {},
                    cors_allow_origins: [],
                    scan_roots: [],
                },
            profile: profileRes.success
                ? profileRes.data.profile
                : {
                    profile_key: "default",
                    mode: "manual",
                    provider_key: null,
                    model_key: null,
                    notes: "",
                    updated_at: "",
                },
        };

        if (!metaRes.success) {
            setState({
                status: "error",
                message: `${metaRes.error.code}: ${metaRes.error.message}`,
                requestId: metaRes.meta?.request_id,
                partial,
            });
            return;
        }

        if (!profileRes.success) {
            setState({
                status: "error",
                message: `${profileRes.error.code}: ${profileRes.error.message}`,
                requestId: profileRes.meta?.request_id,
                partial,
            });
            return;
        }

        setState(partial);
    }

    useEffect(() => {
        void load();
    }, []);

    const roleDefinition: RoleDefinition = useMemo(() => getRoleDefinition(roleKey), [roleKey]);
    const roleDefinitions = useMemo(() => getAllRoleDefinitions(), []);
    const allowedCount = useMemo(() => countAllowedPermissions(roleDefinition), [roleDefinition]);
    const restrictedCount = useMemo(() => countRestrictedPermissions(roleDefinition), [roleDefinition]);

    function applyRole(nextRole: SimulatedRoleKey) {
        setRoleKey(nextRole);
        writeSimulatedRole(nextRole);
        setMessage(`Simulated RBAC role set to ${getRoleDefinition(nextRole).label}.`);
    }

    const data = state.status === "success" ? state : state.status === "error" ? state.partial ?? null : null;
    const adminVisible = roleKey === "admin";

    return (
        <div className="space-y-5">
            <TitanCard
                className="overflow-visible"
                title="Settings"
                subtitle="Manage role-based access, operational permissions, and admin controls for the Herra platform."
                right={
                    <div className="flex gap-2">
                        <TitanButton variant="secondary" onClick={load} disabled={state.status === "loading"}>
                            Refresh
                        </TitanButton>
                    </div>
                }
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Role</div>
                        <div className="mt-2 text-lg font-semibold text-white">{roleDefinition.label}</div>
                        <div className="mt-2 text-xs text-slate-400">
                            Simulated RBAC role for testing visibility and permission behavior.
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Allowed Permissions</div>
                        <div className={["mt-2 text-lg font-semibold", summaryValueClass(allowedCount > 0)].join(" ")}>
                            {allowedCount}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Active permissions granted to the simulated role.
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Restricted Permissions</div>
                        <div className={["mt-2 text-lg font-semibold", summaryValueClass(restrictedCount === 0)].join(" ")}>
                            {restrictedCount}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Restricted items should be hidden or blocked with clear messaging in the UI.
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Advanced Admin Surface</div>
                        <div className={["mt-2 text-lg font-semibold", summaryValueClass(adminVisible)].join(" ")}>
                            {adminVisible ? "Visible" : "Hidden"}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Technical admin-only settings remain hidden unless the simulated role is Administrator.
                        </div>
                    </div>
                </div>

                {state.status === "loading" ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                        Loading Settings control plane…
                    </div>
                ) : null}

                {state.status === "error" ? (
                    <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        <div className="font-semibold">Settings load warning</div>
                        <div className="mt-1 break-words">{state.message}</div>
                        {state.requestId ? (
                            <div className="mt-2 text-xs text-slate-300">request_id: {state.requestId}</div>
                        ) : null}
                        {state.partial ? (
                            <div className="mt-2 text-xs text-slate-300">
                                Partial settings data is shown below where available.
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {message ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200 break-words">
                        {message}
                    </div>
                ) : null}

                {data ? <div className="mt-4 text-xs text-slate-400">request_id: {data.requestId}</div> : null}
            </TitanCard>

            <div className="grid gap-5 xl:grid-cols-12">
                <TitanCard
                    className="xl:col-span-4"
                    title="Role Simulator"
                    subtitle="Simulate RBAC roles now so the app can be tested before full user accounts are added."
                    bodyClassName="p-0"
                >
                    <div className="h-[430px] overflow-y-auto px-5 py-4">
                        <div className="space-y-3">
                            {roleDefinitions.map((role) => {
                                const selected = role.key === roleKey;

                                return (
                                    <button
                                        key={role.key}
                                        type="button"
                                        onClick={() => applyRole(role.key)}
                                        className={[
                                            "w-full rounded-2xl border p-4 text-left transition",
                                            "bg-black/20 hover:bg-black/30",
                                            selected
                                                ? "border-cyan-300/60 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]"
                                                : "border-white/10",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-base font-semibold text-white">{role.label}</div>
                                                <div className="mt-2 text-sm text-slate-300">{role.description}</div>
                                            </div>

                                            <span
                                                className={[
                                                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                                    selected
                                                        ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-100"
                                                        : "border-white/10 bg-white/5 text-slate-200",
                                                ].join(" ")}
                                            >
                                                {selected ? "Active" : role.badgeLabel}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                                This simulator establishes the RBAC model for the current build. Later, these same role rules will be driven by real user accounts instead of browser-stored test state.
                            </div>
                        </div>
                    </div>
                </TitanCard>

                <TitanCard
                    className="xl:col-span-8"
                    title="Access Model"
                    subtitle="The best-fit behavior for this build is RBAC with hidden admin-only surfaces and clearly blocked restricted actions."
                    bodyClassName="p-0"
                >
                    <div className="h-[430px] overflow-y-auto px-5 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="text-sm font-semibold text-white">How the app should behave</div>
                                <div className="mt-3 space-y-3 text-sm text-slate-300">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        Admin-only technical controls should be hidden unless the role is Administrator.
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        Important operational actions can stay visible but should be disabled with clear permission messaging when access is restricted.
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        This lets admins validate permission behavior now while keeping the UI aligned with future real-account RBAC.
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="text-sm font-semibold text-white">Restricted action message preview</div>
                                <div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                                    You do not have permission to complete this action. Contact your administrator or manager for access.
                                </div>
                                <div className="mt-3 text-xs leading-5 text-slate-400">
                                    This is the message pattern other pages should use when a visible action is blocked by RBAC.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
                                <div className="text-sm font-semibold text-white">Why this Settings rebuild matters</div>
                                <div className="mt-3 text-sm leading-6 text-slate-300">
                                    The previous Settings page exposed runtime and environment details as the main experience, which no longer fits the current product direction. Settings now serves as the permissions and administration control center, while Sources and AI Chat continue to own active provider behavior.
                                </div>
                            </div>
                        </div>
                    </div>
                </TitanCard>

                <div className="xl:col-span-6">
                    <PermissionList
                        title="AI Permissions"
                        subtitle="Controls what the current role can do with AI Chat, AI switching, and advanced AI visibility."
                        permissions={roleDefinition.aiPermissions}
                    />
                </div>

                <div className="xl:col-span-6">
                    <PermissionList
                        title="Ingestion & Connector Permissions"
                        subtitle="Controls scan, prepare, ingest, and connector visibility for the current role."
                        permissions={roleDefinition.ingestionPermissions}
                    />
                </div>

                <div className="xl:col-span-12">
                    <PermissionList
                        title="Administrative Permissions"
                        subtitle="Controls permission management and access to deeper platform administration surfaces."
                        permissions={roleDefinition.adminPermissions}
                    />
                </div>

                {adminVisible ? (
                    <TitanCard
                        className="xl:col-span-12"
                        title="Advanced Admin Settings"
                        subtitle="Visible only to the simulated Administrator role. This keeps technical details available for admins without turning the main Settings page into a diagnostics screen."
                        bodyClassName="p-0"
                    >
                        <div className="h-[420px] overflow-y-auto px-5 py-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-sm font-semibold text-white">App Environment</div>
                                    <div className="mt-3 text-sm text-slate-300">
                                        Name: <span className="font-semibold text-white">{data?.meta.app_name ?? "—"}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-300">
                                        Version: <span className="font-semibold text-white">{data?.meta.app_version ?? "—"}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-300">
                                        Environment: <span className="font-semibold text-white">{data?.meta.env ?? "—"}</span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-sm font-semibold text-white">Current Runtime Profile</div>
                                    <div className="mt-3 text-sm text-slate-300">
                                        Mode: <span className="font-semibold text-white">{data?.profile.mode ?? "—"}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-300">
                                        Provider: <span className="font-semibold text-white">{data?.profile.provider_key ?? "—"}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-300">
                                        Model: <span className="font-semibold text-white">{data?.profile.model_key ?? "—"}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-300 break-words">
                                        Notes: <span className="font-semibold text-white">{data?.profile.notes || "—"}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400">
                                        Updated: {formatDateTime(data?.profile.updated_at)}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-sm font-semibold text-white">Scan Roots</div>
                                    <div className="mt-3 text-xs whitespace-pre-wrap break-words text-slate-300">
                                        {(data?.meta.scan_roots ?? []).join("\n") || "—"}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-3">
                                    <div className="text-sm font-semibold text-white">Feature Flags</div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                                            Docs: <span className="font-semibold text-white">{String(data?.meta.features?.docs ?? false)}</span>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                                            Health: <span className="font-semibold text-white">{String(data?.meta.features?.health ?? false)}</span>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                                            Connector Jobs: <span className="font-semibold text-white">{String(data?.meta.features?.connector_jobs ?? false)}</span>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                                            AI Runtime Profile: <span className="font-semibold text-white">{String(data?.meta.features?.ai_runtime_profile ?? false)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TitanCard>
                ) : (
                    <TitanCard
                        className="xl:col-span-12"
                        title="Advanced Admin Settings"
                        subtitle="This surface is hidden for non-admin roles in the current RBAC model."
                    >
                        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                            You do not have permission to view advanced admin settings. Contact your administrator or manager for access.
                        </div>
                    </TitanCard>
                )}
            </div>
        </div>
    );
}
