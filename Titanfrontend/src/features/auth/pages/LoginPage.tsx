import { useNavigate } from "react-router-dom";
import LoginForm from "../../../components/auth/LoginForm";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (input: { email: string; password: string }) => {
        await login(input);
        navigate("/dashboard", { replace: true });
    };

    return (
        <>
            <PageHeader
                title="Titan Employee Access"
                subtitle="Titan Internal Operations Portal"
            />

            {/* Instruction */}
            <div
                style={{
                    marginBottom: "10px",
                    fontSize: "0.95rem",
                    color: "var(--titan-text-soft)",
                }}
            >
                Sign in with your Titan internal credentials.
            </div>

            {/* Warning */}
            <div
                style={{
                    marginBottom: "18px",
                    padding: "12px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 193, 7, 0.35)",
                    background: "rgba(255, 193, 7, 0.08)",
                    color: "#f5d47a",
                    fontSize: "0.9rem",
                }}
            >
                Customer portal login credentials will not work here.
            </div>

            <SectionCard title="Employee Access">
                <LoginForm onSubmit={handleLogin} />
            </SectionCard>
        </>
    );
}