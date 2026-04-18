import type { ButtonHTMLAttributes, ReactNode } from "react";

export type TitanButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: TitanButtonVariant;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    dataMarker?: string;
};

export default function TitanButton({
    variant = "primary",
    leftIcon,
    rightIcon,
    className = "",
    children,
    dataMarker,
    ...rest
}: Props) {
    const base =
        "relative inline-flex items-center justify-center gap-2 select-none rounded-2xl font-semibold tracking-wide " +
        "transition-all duration-200 ease-out transform-gpu focus:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-[#67b7ff]/75 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed " +
        "overflow-hidden px-4 py-2.5 text-sm hover:-translate-y-[1px] active:translate-y-[1px] " +
        "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
        "before:bg-[radial-gradient(700px_220px_at_50%_0%,rgba(255,255,255,0.22),transparent_58%)] " +
        "after:content-[''] after:absolute after:inset-0 after:pointer-events-none " +
        "after:bg-[radial-gradient(580px_180px_at_85%_100%,rgba(103,183,255,0.18),transparent_55%)]";

    const variants: Record<TitanButtonVariant, string> = {
        primary:
            "text-white border border-[#67b7ff]/20 bg-titan-button shadow-button " +
            "hover:border-[#67b7ff]/34 hover:brightness-[1.04] hover:shadow-[0_24px_50px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.18),0_0_0_1px_rgba(126,196,255,0.24)]",
        secondary:
            "text-white/92 border border-white/10 bg-titan-button-secondary " +
            "shadow-[0_14px_34px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[#67b7ff]/18 hover:bg-[linear-gradient(180deg,rgba(17,32,52,0.88)_0%,rgba(11,19,31,0.86)_100%)]",
        ghost:
            "text-white/85 border border-transparent bg-transparent hover:bg-white/6",
        danger:
            "text-white border border-rose-500/32 bg-[linear-gradient(180deg,rgba(133,35,56,0.92)_0%,rgba(86,16,31,0.96)_100%)] " +
            "shadow-[0_18px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.10)] hover:border-rose-400/40",
    };

    return (
        <button
            data-marker={dataMarker}
            className={`${base} ${variants[variant]} ${className}`}
            {...rest}
        >
            {leftIcon ? <span className="relative inline-flex items-center">{leftIcon}</span> : null}
            <span className="relative">{children}</span>
            {rightIcon ? <span className="relative inline-flex items-center">{rightIcon}</span> : null}
        </button>
    );
}