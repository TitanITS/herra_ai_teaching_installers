import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StickyActionBar from "../../../components/common/StickyActionBar";

export default function PricingPage() {
    return (
        <>
            <PageHeader
                title="Pricing"
                subtitle="Clear starting points for Herra Cloud SaaS and Herra Private Deployment, with support tiers and usage pricing designed for organizations that want flexibility without confusion."
            />

            <StickyActionBar />

            <div className="two-column-grid">
                <SectionCard title="Herra Cloud SaaS">
                    <p
                        style={{
                            margin: "0 0 16px",
                            fontSize: "2rem",
                            fontWeight: 700,
                        }}
                    >
                        Starting at $299/month
                    </p>

                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Hosted by Titan for organizations that want a faster launch model, predictable recurring pricing,
                        and secure access into protected environments.
                    </p>

                    <div className="metric-line">
                        <span>Included</span>
                        <strong>1 Secure Network Connector</strong>
                    </div>
                    <div className="metric-line">
                        <span>Standard Support</span>
                        <strong>Included</strong>
                    </div>
                    <div className="metric-line">
                        <span>Contracted token usage</span>
                        <strong>$8 per 1M tokens</strong>
                    </div>
                    <div className="metric-line">
                        <span>Overage token usage</span>
                        <strong>$12 per 1M tokens</strong>
                    </div>
                    <div className="metric-line">
                        <span>Additional Secure Network Connectors</span>
                        <strong>$149/month each</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Herra Private Deployment">
                    <p
                        style={{
                            margin: "0 0 16px",
                            fontSize: "2rem",
                            fontWeight: 700,
                        }}
                    >
                        Starting at $22,500/year
                    </p>

                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        For organizations that want Herra deployed directly into their own environment without relying on
                        Secure Network Connectors or Herra token metering.
                    </p>

                    <div className="metric-line">
                        <span>Setup fee</span>
                        <strong>$12,000</strong>
                    </div>
                    <div className="metric-line">
                        <span>Secure Network Connector requirement</span>
                        <strong>Not required</strong>
                    </div>
                    <div className="metric-line">
                        <span>Herra token metering</span>
                        <strong>Not required</strong>
                    </div>
                    <div className="metric-line">
                        <span>Standard Support</span>
                        <strong>Included</strong>
                    </div>
                    <div className="metric-line">
                        <span>Best fit</span>
                        <strong>Private/internal infrastructure</strong>
                    </div>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Support tiers">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Every Herra deployment includes standard support. Organizations that need faster response times
                        and deeper operational engagement can upgrade based on contract value.
                    </p>

                    <div className="metric-line">
                        <span>Standard Support</span>
                        <strong>Included</strong>
                    </div>
                    <div className="metric-line">
                        <span>Priority Support</span>
                        <strong>+15%</strong>
                    </div>
                    <div className="metric-line">
                        <span>Premium Support</span>
                        <strong>+25%</strong>
                    </div>
                </SectionCard>

                <SectionCard title="How usage works">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Herra Cloud SaaS uses prepaid contracted token plans with overage pricing for usage beyond your
                        contracted amount. This gives organizations a predictable baseline while still supporting variable
                        demand.
                    </p>

                    <div className="metric-line">
                        <span>Pricing model</span>
                        <strong>Contracted + overage</strong>
                    </div>
                    <div className="metric-line">
                        <span>Best fit</span>
                        <strong>Flexible and scalable usage</strong>
                    </div>
                    <div className="metric-line">
                        <span>Enterprise pricing</span>
                        <strong>Available through demo review</strong>
                    </div>
                </SectionCard>
            </div>

            <div className="three-column-grid">
                <SectionCard title="Standard Support">
                    <p className="card-copy" style={{ marginBottom: 14 }}>
                        Included with every Herra deployment.
                    </p>
                    <div className="pill-list">
                        <span className="pill-item">Setup guidance where applicable</span>
                        <span className="pill-item">Herra communication issue support</span>
                        <span className="pill-item">Bug and platform issue handling</span>
                    </div>
                </SectionCard>

                <SectionCard title="Priority Support">
                    <p className="card-copy" style={{ marginBottom: 14 }}>
                        Faster response and higher engagement.
                    </p>
                    <div className="pill-list">
                        <span className="pill-item">Priority response handling</span>
                        <span className="pill-item">Faster review path</span>
                        <span className="pill-item">Scheduled troubleshooting support</span>
                    </div>
                </SectionCard>

                <SectionCard title="Premium Support">
                    <p className="card-copy" style={{ marginBottom: 14 }}>
                        Highest-touch support for organizations needing deeper operational engagement.
                    </p>
                    <div className="pill-list">
                        <span className="pill-item">Highest response priority</span>
                        <span className="pill-item">Deeper troubleshooting engagement</span>
                        <span className="pill-item">Guided support reviews</span>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="What is not included in support">
                <div className="metric-line">
                    <span>General non-Herra IT support</span>
                    <strong>Not included</strong>
                </div>
                <div className="metric-line">
                    <span>Broad third-party infrastructure management</span>
                    <strong>Not included</strong>
                </div>
                <div className="metric-line">
                    <span>Herra-related setup and platform support</span>
                    <strong>Included by tier</strong>
                </div>
            </SectionCard>
        </>
    );
}