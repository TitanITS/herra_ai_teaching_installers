import type { CSSProperties } from "react";
import { Link, Outlet } from "react-router-dom";
import AppShell from "../components/common/AppShell";
import BrandHeader from "../components/common/BrandHeader";
import PublicNav from "../components/navigation/PublicNav";

const customerLoginLinkStyle: CSSProperties = {
    color: "var(--titan-text-soft)",
    fontSize: "0.98rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "color 0.2s ease",
};

export default function PublicLayout() {
    return (
        <AppShell>
            <BrandHeader
                rightContent={
                    <Link
                        className="customer-login-link"
                        to="/login"
                        style={customerLoginLinkStyle}
                    >
                        Customer Login
                    </Link>
                }
            />
            <PublicNav />
            <main className="page-container">
                <Outlet />
            </main>
        </AppShell>
    );
}