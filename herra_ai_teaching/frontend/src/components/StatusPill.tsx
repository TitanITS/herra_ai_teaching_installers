import type { ReactNode } from "react";

export type StatusTone = "ok" | "warn" | "danger" | "info" | "muted";

export type StatusPillProps = {
    // Display
    label?: string;
    children?: ReactNode;

    // Styling (all aliases supported)
    tone?: StatusTone;
    status?: StatusTone;
    variant?: StatusTone;

    className?: string;

    // Optional interactivity (lets pages use it as a pill-button)
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
};

function toneClasses(tone: StatusTone) {
    switch (tone) {
        case "ok":
            return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20";
        case "warn":
            return "bg-amber-500/15 text-amber-200 ring-amber-400/20";
        case "danger":
            return "bg-rose-500/15 text-rose-200 ring-rose-400/20";
        case "info":
            return "bg-cyan-500/15 text-cyan-200 ring-cyan-400/20";
        case "muted":
        default:
            return "bg-white/10 text-white/70 ring-white/10";
    }
}

export function StatusPill(props: StatusPillProps) {
    const {
        label,
        children,
        tone,
        status,
        variant,
        className = "",
        onClick,
        disabled,
        title,
    } = props;

    const resolvedTone: StatusTone = tone ?? status ?? variant ?? "muted";
    const content = label ?? children ?? "";

    const base =
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 select-none whitespace-nowrap";
    const interactive =
        onClick
            ? "cursor-pointer transition hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            : "";

    const cls = `${base} ${toneClasses(resolvedTone)} ${interactive} ${className}`;

    // If clickable, render a <button> so TS + accessibility are correct.
    if (onClick) {
        return (
            <button
                type="button"
                className={cls}
                onClick={onClick}
                disabled={disabled}
                title={title}
            >
                {content}
            </button>
        );
    }

    // Otherwise render a normal badge.
    return (
        <span className={cls} title={title}>
            {content}
        </span>
    );
}

// Also provide default export to prevent import-style mismatches.
export default StatusPill;
