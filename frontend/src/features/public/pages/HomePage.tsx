import SectionCard from "../../../components/common/SectionCard";
import StickyActionBar from "../../../components/common/StickyActionBar";

export default function HomePage() {
    return (
        <>
            <section
                className="section-card hero-panel"
                style={{
                    marginBottom: 18,
                }}
            >
                <div className="two-column-grid hero-grid" style={{ alignItems: "center", marginBottom: 0 }}>
                    <div>
                        <div className="hero-eyebrow">Titan Information Technology Solutions</div>

                        <h1 className="hero-title">Herra AI Teaching</h1>

                        <div className="hero-subtitle">AI Interpretation and Enablement Platform</div>

                        <p className="hero-motto">
                            Empowering organizations with intelligent systems designed to move them forward.
                        </p>

                        <p
                            className="card-copy"
                            style={{
                                fontSize: "1.02rem",
                                maxWidth: 760,
                                marginBottom: 0,
                            }}
                        >
                            Herra helps organizations accelerate AI understanding across their environments by reducing
                            translation errors, lowering engineering overhead, and improving the speed of system learning
                            across customer-owned AI services.
                        </p>
                    </div>

                    <div>
                        <SectionCard title="Why organizations choose Herra">
                            <div className="metric-line">
                                <span>Reduce engineering overhead</span>
                                <strong>Less translation work</strong>
                            </div>
                            <div className="metric-line">
                                <span>Accelerate AI understanding</span>
                                <strong>Faster time to value</strong>
                            </div>
                            <div className="metric-line">
                                <span>Improve interpretation quality</span>
                                <strong>Fewer avoidable errors</strong>
                            </div>
                            <div className="metric-line">
                                <span>Expand securely</span>
                                <strong>Secure Network Connectors</strong>
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </section>

            <StickyActionBar />

            <div className="three-column-grid">
                <SectionCard title="Reduce engineering lift">
                    <p className="card-copy">
                        Herra reduces the amount of manual translation effort required to help AI systems understand
                        business environments, structures, and data sources.
                    </p>
                </SectionCard>

                <SectionCard title="Improve learning efficiency">
                    <p className="card-copy">
                        By improving the interpretation layer between systems and customer-owned AI, Herra helps
                        organizations reduce friction and move faster with more confidence.
                    </p>
                </SectionCard>

                <SectionCard title="Operate with confidence">
                    <p className="card-copy">
                        Choose hosted SaaS with Secure Network Connectors or deploy Herra directly in your own environment
                        through Private Deployment.
                    </p>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Deployment models">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Herra is available in two deployment models so organizations can choose the structure that best
                        fits their infrastructure, security posture, and operational expectations.
                    </p>

                    <div className="metric-line">
                        <span>Herra Cloud SaaS</span>
                        <strong>Hosted by Titan</strong>
                    </div>
                    <div className="metric-line">
                        <span>Herra Private Deployment</span>
                        <strong>Runs in your environment</strong>
                    </div>
                    <div className="metric-line">
                        <span>SaaS secure bridge</span>
                        <strong>Secure Network Connectors</strong>
                    </div>
                    <div className="metric-line">
                        <span>Private Deployment connector requirement</span>
                        <strong>Not required</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Pricing snapshot">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Public pricing stays simple on the homepage. Full commercial detail, support tiers, and usage
                        guidance are available on the Pricing page.
                    </p>

                    <div className="metric-line">
                        <span>Herra Cloud SaaS</span>
                        <strong>Starting at $299/month</strong>
                    </div>
                    <div className="metric-line">
                        <span>Included with Cloud</span>
                        <strong>1 Secure Network Connector</strong>
                    </div>
                    <div className="metric-line">
                        <span>Herra Private Deployment</span>
                        <strong>Starting at $22,500/year</strong>
                    </div>
                    <div className="metric-line">
                        <span>Private setup fee</span>
                        <strong>$12,000</strong>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Secure Network Connectors">
                <p className="card-copy" style={{ marginBottom: 16 }}>
                    In the Herra Cloud SaaS model, Secure Network Connectors provide the secure bridge between your hosted
                    Herra environment and protected customer networks. This gives organizations a safer way to extend
                    Herra into environments that cannot be openly exposed.
                </p>

                <div className="metric-line">
                    <span>Included with Herra Cloud SaaS</span>
                    <strong>1 Secure Network Connector</strong>
                </div>
                <div className="metric-line">
                    <span>Additional Secure Network Connectors</span>
                    <strong>$149/month each</strong>
                </div>
            </SectionCard>

            <SectionCard title="Why Titan exists">
                <p className="card-copy" style={{ marginBottom: 16 }}>
                    Titan is focused on building intelligent systems that help organizations move faster with more clarity
                    and less wasted effort. We are not positioning ourselves as a general break-fix support provider. We
                    build solutions designed to improve how systems operate, interpret, and move forward.
                </p>

                <div className="metric-line">
                    <span>Company posture</span>
                    <strong>Solutions provider</strong>
                </div>
                <div className="metric-line">
                    <span>Primary value</span>
                    <strong>Interpretation and enablement</strong>
                </div>
                <div className="metric-line">
                    <span>Customer focus</span>
                    <strong>Operational clarity and speed</strong>
                </div>
            </SectionCard>
        </>
    );
}