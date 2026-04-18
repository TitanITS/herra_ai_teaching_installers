export type SimulatedRoleKey = "admin" | "manager" | "technician";

export type RolePermission = {
    key: string;
    label: string;
    allowed: boolean;
    description: string;
};

export type RoleDefinition = {
    key: SimulatedRoleKey;
    label: string;
    badgeLabel: string;
    description: string;
    aiPermissions: RolePermission[];
    ingestionPermissions: RolePermission[];
    adminPermissions: RolePermission[];
};

const STORAGE_KEY = "herra_simulated_rbac_role_v1";

const ROLE_DEFINITIONS: Record<SimulatedRoleKey, RoleDefinition> = {
    admin: {
        key: "admin",
        label: "Administrator",
        badgeLabel: "Admin",
        description: "Full platform access. Can manage AI behavior, role testing, ingestion workflows, and advanced admin-only controls.",
        aiPermissions: [
            {
                key: "ai_chat_use",
                label: "Use AI Chat",
                allowed: true,
                description: "Can open AI Chat and send messages to connected AIs.",
            },
            {
                key: "ai_switch",
                label: "Switch AI identities",
                allowed: true,
                description: "Can change the active AI and sync that change with Sources.",
            },
            {
                key: "ai_context",
                label: "Use retrieved context",
                allowed: true,
                description: "Can enable ingested-context support in AI Chat.",
            },
            {
                key: "ai_runtime_view",
                label: "View advanced AI runtime details",
                allowed: true,
                description: "Can view provider/model/runtime details in admin-only areas.",
            },
        ],
        ingestionPermissions: [
            {
                key: "scan_run",
                label: "Run Auto Detect scans",
                allowed: true,
                description: "Can trigger scans against connector-accessible locations.",
            },
            {
                key: "prepare_ingest",
                label: "Prepare ingest jobs",
                allowed: true,
                description: "Can prepare files and folders for ingestion.",
            },
            {
                key: "execute_ingest",
                label: "Execute ingestion",
                allowed: true,
                description: "Can commit ingest actions into the platform pipeline.",
            },
            {
                key: "connector_view",
                label: "View connector records",
                allowed: true,
                description: "Can review connector availability, host data, and access status.",
            },
        ],
        adminPermissions: [
            {
                key: "role_manage",
                label: "Manage permissions",
                allowed: true,
                description: "Can manage or simulate role-based access settings.",
            },
            {
                key: "advanced_settings",
                label: "Access advanced admin settings",
                allowed: true,
                description: "Can view internal environment and advanced configuration details.",
            },
            {
                key: "system_exports",
                label: "Export and inspect system-level details",
                allowed: true,
                description: "Can inspect system metadata and supporting administrative information.",
            },
        ],
    },
    manager: {
        key: "manager",
        label: "Manager",
        badgeLabel: "Manager",
        description: "Operational oversight access. Can use AI features and ingestion workflows, but cannot change advanced admin controls.",
        aiPermissions: [
            {
                key: "ai_chat_use",
                label: "Use AI Chat",
                allowed: true,
                description: "Can open AI Chat and send messages to connected AIs.",
            },
            {
                key: "ai_switch",
                label: "Switch AI identities",
                allowed: true,
                description: "Can switch between approved AI identities during operational work.",
            },
            {
                key: "ai_context",
                label: "Use retrieved context",
                allowed: true,
                description: "Can enable ingested-context support in AI Chat.",
            },
            {
                key: "ai_runtime_view",
                label: "View advanced AI runtime details",
                allowed: false,
                description: "Advanced provider/runtime internals remain admin-only.",
            },
        ],
        ingestionPermissions: [
            {
                key: "scan_run",
                label: "Run Auto Detect scans",
                allowed: true,
                description: "Can trigger scans against connector-accessible locations.",
            },
            {
                key: "prepare_ingest",
                label: "Prepare ingest jobs",
                allowed: true,
                description: "Can prepare files and folders for ingestion.",
            },
            {
                key: "execute_ingest",
                label: "Execute ingestion",
                allowed: true,
                description: "Can run ingestion for approved workflows.",
            },
            {
                key: "connector_view",
                label: "View connector records",
                allowed: true,
                description: "Can review connector availability and operational status.",
            },
        ],
        adminPermissions: [
            {
                key: "role_manage",
                label: "Manage permissions",
                allowed: false,
                description: "Role and permission administration remains restricted to admins.",
            },
            {
                key: "advanced_settings",
                label: "Access advanced admin settings",
                allowed: false,
                description: "Advanced environment and configuration controls remain admin-only.",
            },
            {
                key: "system_exports",
                label: "Export and inspect system-level details",
                allowed: false,
                description: "System-level administrative exports remain admin-only.",
            },
        ],
    },
    technician: {
        key: "technician",
        label: "Technician",
        badgeLabel: "Technician",
        description: "Execution-focused access. Can use operational features but cannot manage role controls or advanced admin settings.",
        aiPermissions: [
            {
                key: "ai_chat_use",
                label: "Use AI Chat",
                allowed: true,
                description: "Can open AI Chat and send messages to connected AIs.",
            },
            {
                key: "ai_switch",
                label: "Switch AI identities",
                allowed: false,
                description: "Switching the active AI is restricted and requires administrator approval.",
            },
            {
                key: "ai_context",
                label: "Use retrieved context",
                allowed: true,
                description: "Can use approved ingested context in AI Chat.",
            },
            {
                key: "ai_runtime_view",
                label: "View advanced AI runtime details",
                allowed: false,
                description: "Advanced provider/runtime internals remain hidden.",
            },
        ],
        ingestionPermissions: [
            {
                key: "scan_run",
                label: "Run Auto Detect scans",
                allowed: true,
                description: "Can run scans required for assigned technical work.",
            },
            {
                key: "prepare_ingest",
                label: "Prepare ingest jobs",
                allowed: true,
                description: "Can prepare ingestion work for operational tasks.",
            },
            {
                key: "execute_ingest",
                label: "Execute ingestion",
                allowed: false,
                description: "Final ingestion execution remains restricted to higher-trust roles.",
            },
            {
                key: "connector_view",
                label: "View connector records",
                allowed: true,
                description: "Can review connector status needed for operational troubleshooting.",
            },
        ],
        adminPermissions: [
            {
                key: "role_manage",
                label: "Manage permissions",
                allowed: false,
                description: "Permission management remains restricted to admins.",
            },
            {
                key: "advanced_settings",
                label: "Access advanced admin settings",
                allowed: false,
                description: "Advanced environment and configuration controls remain hidden.",
            },
            {
                key: "system_exports",
                label: "Export and inspect system-level details",
                allowed: false,
                description: "System-level administrative exports remain restricted.",
            },
        ],
    },
};

export function getRoleDefinition(role: SimulatedRoleKey): RoleDefinition {
    return ROLE_DEFINITIONS[role];
}

export function getAllRoleDefinitions(): RoleDefinition[] {
    return [ROLE_DEFINITIONS.admin, ROLE_DEFINITIONS.manager, ROLE_DEFINITIONS.technician];
}

export function readSimulatedRole(): SimulatedRoleKey {
    if (typeof window === "undefined") return "admin";

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "admin" || stored === "manager" || stored === "technician") {
        return stored;
    }

    return "admin";
}

export function writeSimulatedRole(role: SimulatedRoleKey) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, role);
}

export function countAllowedPermissions(role: RoleDefinition): number {
    return [...role.aiPermissions, ...role.ingestionPermissions, ...role.adminPermissions].filter((item) => item.allowed).length;
}

export function countRestrictedPermissions(role: RoleDefinition): number {
    return [...role.aiPermissions, ...role.ingestionPermissions, ...role.adminPermissions].filter((item) => !item.allowed).length;
}
