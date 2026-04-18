import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StickyActionBar from "../../../components/common/StickyActionBar";

export default function ProductPage() {
    return (
        <>
            <PageHeader
                title="Herra AI Teaching"
                subtitle="AI Interpretation and Enablement Platform for organizations that want to accelerate AI understanding without unnecessary translation overhead."
            />

            <StickyActionBar />

            <div className="two-column-grid">
                <SectionCard title="What Herra does">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Herra acts as the interpretation and enablement layer between your environments and your
                        customer-owned AI services. It is designed to reduce translation friction, improve learning
                        efficiency, and help organizations move faster with fewer avoidable errors.
                    </p>

                    <div className="metric-line">
                        <span>Primary outcome</span>
                        <strong>Faster AI understanding</strong>
                    </div>
                    <div className="metric-line">
                        <span>Operational value</span>
                        <strong>Lower engineering effort</strong>
                    </div>
                    <div className="metric-line">
                        <span>Business benefit</span>
                        <strong>Quicker time to value</strong>
                    </div>
                </SectionCard>

                <SectionCard title="What Herra is not">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Herra is not positioned as a general technical support service or a replacement for the AI systems
                        your organization already owns. It is designed to make those systems more effective by improving
                        interpretation and enablement across environments.
                    </p>

                    <div className="metric-line">
                        <span>Not a generic chatbot</span>
                        <strong>Focused platform</strong>
                    </div>
                    <div className="metric-line">
                        <span>Not broad IT support</span>
                        <strong>Software and systems solution</strong>
                    </div>
                    <div className="metric-line">
                        <span>Not your AI provider</span>
                        <strong>Interpretation layer</strong>
                    </div>
                </SectionCard>
            </div>

            <div className="three-column-grid">
                <SectionCard title="Reduce translation errors">
                    <p className="card-copy">
                        Improve the quality of system interpretation so your AI workflows can learn more effectively with
                        less manual intervention.
                    </p>
                </SectionCard>

                <SectionCard title="Lower engineering overhead">
                    <p className="card-copy">
                        Reduce the amount of engineering effort required to translate and structure information for ongoing
                        AI understanding.
                    </p>
                </SectionCard>

                <SectionCard title="Improve deployment speed">
                    <p className="card-copy">
                        Give teams a more efficient path from environment access to useful AI understanding through a
                        cleaner enablement layer.
                    </p>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="Deployment options">
                    <div className="metric-line">
                        <span>Herra Cloud SaaS</span>
                        <strong>Hosted by Titan</strong>
                    </div>
                    <div className="metric-line">
                        <span>Secure reach into private environments</span>
                        <strong>Secure Network Connectors</strong>
                    </div>
                    <div className="metric-line">
                        <span>Herra Private Deployment</span>
                        <strong>Runs in your environment</strong>
                    </div>
                    <div className="metric-line">
                        <span>Connector requirement for Private Deployment</span>
                        <strong>Not required</strong>
                    </div>
                </SectionCard>

                <SectionCard title="Operational fit">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Herra is built for organizations that care about speed, clarity, system learning efficiency, and a
                        more disciplined path between their environments and the intelligence they already own.
                    </p>

                    <div className="metric-line">
                        <span>Ideal buyer</span>
                        <strong>Organizations with real system complexity</strong>
                    </div>
                    <div className="metric-line">
                        <span>Core advantage</span>
                        <strong>Interpretation and enablement</strong>
                    </div>
                    <div className="metric-line">
                        <span>Support model</span>
                        <strong>Standard included, upgraded tiers available</strong>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}