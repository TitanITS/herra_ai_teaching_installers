import { useState } from "react";
import { submitDemoRequest } from "../../../api/demoRequests";
import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StickyActionBar from "../../../components/common/StickyActionBar";

type DemoRequestFormState = {
    fullName: string;
    companyName: string;
    email: string;
    phone: string;
    deploymentInterest: string;
    estimatedUsage: string;
    message: string;
};

const initialFormState: DemoRequestFormState = {
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    deploymentInterest: "Herra Cloud SaaS",
    estimatedUsage: "",
    message: "",
};

export default function ContactPage() {
    const [formState, setFormState] = useState<DemoRequestFormState>(initialFormState);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const response = await submitDemoRequest({
                full_name: formState.fullName,
                company_name: formState.companyName,
                email: formState.email,
                phone: formState.phone,
                deployment_interest: formState.deploymentInterest,
                estimated_usage: formState.estimatedUsage,
                message: formState.message,
            });

            setSuccessMessage(response.message || "Demo request submitted successfully.");
            setFormState(initialFormState);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to submit demo request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Request a Demo"
                subtitle="Start a conversation about your environment, your AI goals, and which Herra deployment model is the best fit for your organization."
            />

            <StickyActionBar />

            {successMessage ? <div className="success-banner">{successMessage}</div> : null}
            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            <div className="two-column-grid">
                <SectionCard title="Demo request form">
                    <form className="demo-request-form" onSubmit={handleSubmit}>
                        <label className="field-group">
                            <span>Full name</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.fullName}
                                onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Company name</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.companyName}
                                onChange={(event) =>
                                    setFormState((current) => ({ ...current, companyName: event.target.value }))
                                }
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Work email</span>
                            <input
                                className="field-input"
                                type="email"
                                value={formState.email}
                                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                                required
                            />
                        </label>

                        <label className="field-group">
                            <span>Phone number</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.phone}
                                onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
                            />
                        </label>

                        <label className="field-group">
                            <span>Deployment interest</span>
                            <select
                                className="field-input"
                                value={formState.deploymentInterest}
                                onChange={(event) =>
                                    setFormState((current) => ({ ...current, deploymentInterest: event.target.value }))
                                }
                            >
                                <option value="Herra Cloud SaaS">Herra Cloud SaaS</option>
                                <option value="Herra Private Deployment">Herra Private Deployment</option>
                                <option value="Not sure yet">Not sure yet</option>
                            </select>
                        </label>

                        <label className="field-group">
                            <span>Estimated interpretation volume or usage notes</span>
                            <input
                                className="field-input"
                                type="text"
                                value={formState.estimatedUsage}
                                onChange={(event) =>
                                    setFormState((current) => ({ ...current, estimatedUsage: event.target.value }))
                                }
                                placeholder="Example: 20M tokens/month or early estimate"
                            />
                        </label>

                        <label className="field-group">
                            <span>What would you like to discuss?</span>
                            <textarea
                                className="field-input field-input--textarea"
                                value={formState.message}
                                onChange={(event) => setFormState((current) => ({ ...current, message: event.target.value }))}
                                rows={6}
                                required
                            />
                        </label>

                        <button className="primary-button" disabled={isSubmitting} type="submit">
                            {isSubmitting ? "Submitting..." : "Submit Demo Request"}
                        </button>
                    </form>
                </SectionCard>

                <div className="request-demo-side-stack">
                    <SectionCard title="What happens next">
                        <div className="metric-line">
                            <span>Step 1</span>
                            <strong>Review environment fit</strong>
                        </div>
                        <div className="metric-line">
                            <span>Step 2</span>
                            <strong>Discuss deployment model</strong>
                        </div>
                        <div className="metric-line">
                            <span>Step 3</span>
                            <strong>Review pricing and support tier</strong>
                        </div>
                        <div className="metric-line">
                            <span>Step 4</span>
                            <strong>Schedule guided onboarding</strong>
                        </div>
                    </SectionCard>

                    <SectionCard title="Recommended discussion points">
                        <div className="pill-list">
                            <span className="pill-item">Environment fit</span>
                            <span className="pill-item">Deployment model</span>
                            <span className="pill-item">Interpretation volume</span>
                            <span className="pill-item">Secure Network Connector needs</span>
                            <span className="pill-item">Support tier</span>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </>
    );
}