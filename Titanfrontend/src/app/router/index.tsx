import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import ConnectorsPage from "../../features/app/pages/ConnectorsPage";
import CustomersPage from "../../features/app/pages/CustomersPage";
import DashboardPage from "../../features/app/pages/DashboardPage";
import DeploymentsPage from "../../features/app/pages/DeploymentsPage";
import SalesPage from "../../features/app/pages/SalesPage";
import TechnicianWorkspacePage from "../../features/app/pages/TechnicianWorkspacePage";
import LoginPage from "../../features/auth/pages/LoginPage";
import AuthLayout from "../../layouts/AuthLayout";
import TitanLayout from "../../layouts/TitanLayout";

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route
                element={
                    <ProtectedRoute>
                        <TitanLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/deployments" element={<DeploymentsPage />} />
                <Route path="/connectors" element={<ConnectorsPage />} />
                <Route path="/my-page" element={<TechnicianWorkspacePage />} />
                <Route path="/technician" element={<Navigate to="/my-page" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}