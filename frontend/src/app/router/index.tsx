import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import PortalLayout from "../../layouts/PortalLayout";
import PublicLayout from "../../layouts/PublicLayout";
import BillingPage from "../../features/portal/pages/BillingPage";
import ConnectorsPage from "../../features/portal/pages/ConnectorsPage";
import DashboardPage from "../../features/portal/pages/DashboardPage";
import DeploymentPage from "../../features/portal/pages/DeploymentPage";
import RolesPermissionsPage from "../../features/portal/pages/RolesPermissionsPage";
import SettingsPage from "../../features/portal/pages/SettingsPage";
import SupportPage from "../../features/portal/pages/SupportPage";
import UsersPage from "../../features/portal/pages/UsersPage";
import AboutPage from "../../features/public/pages/AboutPage";
import ContactPage from "../../features/public/pages/ContactPage";
import HomePage from "../../features/public/pages/HomePage";
import LoginPage from "../../features/public/pages/LoginPage";
import PricingPage from "../../features/public/pages/PricingPage";
import ProductPage from "../../features/public/pages/ProductPage";

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route
                path="/portal"
                element={
                    <ProtectedRoute>
                        <PortalLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/portal/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="roles-permissions" element={<RolesPermissionsPage />} />
                <Route path="deployments" element={<DeploymentPage />} />
                <Route path="connectors" element={<ConnectorsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}