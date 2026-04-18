import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import { useAuth } from "../../../hooks/auth/useAuth";

const fieldWrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const fieldLabelStyle: React.CSSProperties = {
    color: "var(--titan-text)",
    fontWeight: 600,
    fontSize: "0.95rem",
};

const fieldInputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "48px",
    padding: "0 14px",
    borderRadius: "14px",
    border: "1px solid rgba(114, 183, 255, 0.25)",
    background: "rgba(12, 28, 54, 0.96)",
    color: "#ffffff",
    outline: "none",
};

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("customer.admin@demo.local");
    const [password, setPassword] = useState("ChangeMe123!");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await login({ email, password });
            navigate("/portal/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container dashboard-page">
            <PageHeader
                title="Customer Portal Login"
                subtitle="Sign in to access your Titan customer portal."
            />

            {error ? <div className="error-banner">{error}</div> : null}

            <div
                style={{
                    width: "100%",
                    maxWidth: "640px",
                }}
            >
                <SectionCard title="Portal Access">
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "22px",
                        }}
                    >
                        <label style={fieldWrapStyle}>
                            <span style={fieldLabelStyle}>Email</span>
                            <input
                                style={fieldInputStyle}
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label style={fieldWrapStyle}>
                            <span style={fieldLabelStyle}>Password</span>
                            <input
                                style={fieldInputStyle}
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "4px",
                            }}
                        >
                            <button className="primary-button" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Logging In..." : "Login"}
                            </button>
                        </div>
                    </form>
                </SectionCard>
            </div>
        </div>
    );
}