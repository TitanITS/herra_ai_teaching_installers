import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth";
import { useCustomerAccount } from "../hooks/portal/useCustomerAccount";
import AppShell from "../components/common/AppShell";
import BrandHeader from "../components/common/BrandHeader";
import TopTicker from "../components/common/TopTicker";
import PortalNav from "../components/navigation/PortalNav";

export default function PortalLayout() {
    const { user, logout } = useAuth();
    const { notifications } = useCustomerAccount();

    return (
        <AppShell>
            <BrandHeader
                rightContent={
                    <div className="header-user-panel">
                        <div className="header-user-name">{user?.email ?? "Customer User"}</div>
                        <button className="primary-button" onClick={logout} type="button">
                            Logout
                        </button>
                    </div>
                }
            />
            <TopTicker notifications={notifications} />
            <PortalNav />
            <main className="page-container">
                <Outlet />
            </main>
        </AppShell>
    );
}