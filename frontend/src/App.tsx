import { BrowserRouter } from "react-router-dom";
import AppRouter from "./app/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import { TenantProvider } from "./app/providers/TenantProvider";
import { ThemeProvider } from "./app/providers/ThemeProvider";

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <TenantProvider>
                        <AppRouter />
                    </TenantProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}