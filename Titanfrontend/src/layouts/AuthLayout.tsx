import { Outlet } from "react-router-dom";
import AppShell from "../components/common/AppShell";
import BrandHeader from "../components/common/BrandHeader";

export default function AuthLayout() {
    return (
        <AppShell>
            <BrandHeader
                title="Titan Employee Access"
                subtitle="Internal Titan operations login for platform administration and internal deployment visibility."
            />
            <main className="page-container auth-page-container">
                <Outlet />
            </main>
        </AppShell>
    );
}
