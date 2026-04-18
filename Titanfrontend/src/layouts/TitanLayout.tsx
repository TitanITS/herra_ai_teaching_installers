import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth";
import AppShell from "../components/common/AppShell";
import BrandHeader from "../components/common/BrandHeader";
import TitanNav from "../components/navigation/TitanNav";

export default function TitanLayout() {
    const { user, logout } = useAuth();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Titan Employee";
    const roleSummary = user?.role_names.join(", ") || "Platform User";

    return (
        <AppShell>
            <BrandHeader
                rightContent={
                    <div className="header-user-panel">
                        <div>
                            <div className="header-user-name">{fullName}</div>
                            <div className="header-user-role">{roleSummary}</div>
                        </div>
                        <button className="ghost-button" onClick={logout} type="button">
                            Logout
                        </button>
                    </div>
                }
            />
            <TitanNav />
            <main className="page-container">
                <Outlet />
            </main>
        </AppShell>
    );
}