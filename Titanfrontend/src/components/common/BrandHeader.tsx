import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

type BrandHeaderProps = {
    title?: string;
    subtitle?: string;
    rightContent?: ReactNode;
};

const DEFAULT_TITLE = "Titan Information Technology Solutions";
const DEFAULT_SUBTITLE = "Empowering organizations with intelligent systems designed to move them forward.";

const headerStyles = {
    root: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "18px",
        padding: "24px 30px",
        border: "1px solid var(--titan-border)",
        borderRadius: "var(--titan-radius-lg)",
        background:
            "radial-gradient(circle at 82% 20%, rgba(114, 183, 255, 0.08), transparent 24%), linear-gradient(180deg, rgba(8, 20, 39, 0.96), rgba(7, 18, 35, 0.92))",
        boxShadow: "var(--titan-shadow)",
    } satisfies CSSProperties,

    left: {
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
        minWidth: 0,
        flex: "1 1 auto",
    } satisfies CSSProperties,

    homeLink: {
        display: "inline-flex",
        alignItems: "flex-start",
        justifyContent: "center",
        flex: "0 0 auto",
        marginTop: "-24px",
        marginRight: "-2px",
    } satisfies CSSProperties,

    logo: {
        width: "148px",
        height: "148px",
        objectFit: "contain",
        display: "block",
        flex: "0 0 auto",
    } satisfies CSSProperties,

    copy: {
        minWidth: 0,
        paddingTop: "2px",
    } satisfies CSSProperties,

    titleLink: {
        display: "inline-block",
    } satisfies CSSProperties,

    title: {
        fontSize: "2.45rem",
        fontWeight: 700,
        letterSpacing: "0.01em",
        lineHeight: 1.04,
        maxWidth: "980px",
        margin: 0,
    } satisfies CSSProperties,

    subtitle: {
        color: "var(--titan-text-soft)",
        maxWidth: "980px",
        lineHeight: 1.35,
        fontSize: "0.98rem",
        marginTop: "12px",
    } satisfies CSSProperties,

    right: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        flex: "0 0 auto",
        paddingTop: "8px",
    } satisfies CSSProperties,
};

export default function BrandHeader({
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    rightContent,
}: BrandHeaderProps) {
    return (
        <header className="brand-header" style={headerStyles.root}>
            <div className="brand-header__left" style={headerStyles.left}>
                <Link
                    className="brand-header__home-link"
                    to="/dashboard"
                    aria-label="Go to dashboard"
                    style={headerStyles.homeLink}
                >
                    <img
                        className="brand-header__logo"
                        src="/titan-logo.png"
                        alt="Titan logo"
                        style={headerStyles.logo}
                    />
                </Link>

                <div className="brand-header__copy" style={headerStyles.copy}>
                    <Link className="brand-header__title-link" to="/dashboard" style={headerStyles.titleLink}>
                        <div className="brand-header__title" style={headerStyles.title}>
                            {title}
                        </div>
                    </Link>

                    <div className="brand-header__subtitle" style={headerStyles.subtitle}>
                        {subtitle}
                    </div>
                </div>
            </div>

            <div className="brand-header__right" style={headerStyles.right}>
                {rightContent}
            </div>
        </header>
    );
}