type StatusBadgeProps = {
    status?: string | null;
};

function normalizeStatus(status?: string | null) {
    const safeStatus = typeof status === "string" ? status.trim() : "";

    if (!safeStatus) {
        return "unknown";
    }

    return safeStatus.toLowerCase().replace(/\s+/g, "-");
}

function getDisplayStatus(status?: string | null) {
    const safeStatus = typeof status === "string" ? status.trim() : "";
    return safeStatus || "Unknown";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`status-badge status-badge--${normalizeStatus(status)}`}>
            {getDisplayStatus(status)}
        </span>
    );
}