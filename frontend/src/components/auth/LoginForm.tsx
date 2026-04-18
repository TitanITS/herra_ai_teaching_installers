import { useState } from "react";

type LoginFormProps = {
    onSubmit: (input: { email: string; password: string }) => Promise<void>;
};

export default function LoginForm({ onSubmit }: LoginFormProps) {
    const [email, setEmail] = useState("customer.admin@demo.local");
    const [password, setPassword] = useState("ChangeMe123!");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await onSubmit({ email, password });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-group">
                <span>Email</span>
                <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
            </label>

            <label className="field-group">
                <span>Password</span>
                <input
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            </label>

            {error ? <div className="form-error">{error}</div> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login"}
            </button>
        </form>
    );
}