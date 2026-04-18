import type { ReactNode } from "react";

export type TitanCardProps = {
    title?: string;
    subtitle?: string;
    right?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
};

export function TitanCard({
    title,
    right,
    children,
    subtitle,
    className,
    bodyClassName,
    headerClassName,
}: TitanCardProps) {
    return (
        <div
            className={[
                "relative w-full overflow-hidden rounded-3xl border border-white/10 bg-titan-panel shadow-glow backdrop-blur-[2px]",
                className ?? "",
            ].join(" ")}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_260px_at_50%_0%,rgba(126,196,255,0.10),transparent_56%),radial-gradient(420px_180px_at_88%_100%,rgba(103,183,255,0.08),transparent_55%)]" />

            {(title || right || subtitle) && (
                <div
                    className={[
                        "relative border-b border-white/10 px-5 py-4",
                        headerClassName ?? "",
                    ].join(" ")}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            {title && <div className="text-base font-semibold text-titan-text">{title}</div>}
                            {subtitle && <div className="mt-1 text-sm text-titan-muted">{subtitle}</div>}
                        </div>

                        {right ? <div className="shrink-0">{right}</div> : null}
                    </div>
                </div>
            )}

            <div className={["relative px-5 py-4", bodyClassName ?? ""].join(" ")}>{children}</div>
        </div>
    );
}

export default TitanCard;