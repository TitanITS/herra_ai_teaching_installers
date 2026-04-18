import PageHeader from "../../../components/common/PageHeader";
import SectionCard from "../../../components/common/SectionCard";
import StickyActionBar from "../../../components/common/StickyActionBar";

export default function AboutPage() {
    return (
        <>
            <PageHeader
                title="About Titan"
                subtitle="Titan Information Technology Solutions is focused on building intelligent systems that help organizations move faster with more clarity, less wasted effort, and stronger operational confidence."
            />

            <StickyActionBar />

            <SectionCard title="What we believe">
                <p
                    className="card-copy"
                    style={{
                        fontSize: "1.1rem",
                        lineHeight: 1.8,
                        marginBottom: 18,
                        maxWidth: 980,
                    }}
                >
                    At Titan, we believe intelligent systems should help organizations move forward, not bury them under
                    unnecessary complexity, translation overhead, or avoidable friction. We believe clarity creates
                    momentum, efficiency matters in real operations, and systems should work with confidence.
                </p>

                <p
                    style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--titan-text)",
                    }}
                >
                    — Louis Yuhas, Founder, Titan Information Technology Solutions
                </p>
            </SectionCard>

            <div className="three-column-grid">
                <SectionCard title="Build with purpose">
                    <p className="card-copy">
                        We want every part of the experience to reflect care, structure, and confidence, from the public
                        site to the operational software itself.
                    </p>
                </SectionCard>

                <SectionCard title="Reduce wasted effort">
                    <p className="card-copy">
                        Our products are designed to help organizations reduce unnecessary engineering lift and move
                        through complexity with more discipline.
                    </p>
                </SectionCard>

                <SectionCard title="Support what we build">
                    <p className="card-copy">
                        Titan supports the software and systems we provide. That keeps the relationship focused,
                        deliberate, and aligned to the value Herra is built to deliver.
                    </p>
                </SectionCard>
            </div>

            <div className="two-column-grid">
                <SectionCard title="How we position Titan">
                    <p className="card-copy" style={{ marginBottom: 16 }}>
                        Titan is positioned as a solutions provider. We design software and intelligent systems that help
                        organizations improve how they operate. We are not presenting ourselves as a general external IT
                        support company.
                    </p>

                    <div className="metric-line">
                        <span>Company posture</span>
                        <strong>Solutions provider</strong>
                    </div>
                    <div className="metric-line">
                        <span>Primary focus</span>
                        <strong>Software and intelligent systems</strong>
                    </div>
                    <div className="metric-line">
                        <span>Public message</span>
                        <strong>Forward movement and enablement</strong>
                    </div>
                </SectionCard>

                <SectionCard title="What matters to us">
                    <div className="metric-line">
                        <span>Clarity</span>
                        <strong>Creates momentum</strong>
                    </div>
                    <div className="metric-line">
                        <span>Efficiency</span>
                        <strong>Matters in real operations</strong>
                    </div>
                    <div className="metric-line">
                        <span>Confidence</span>
                        <strong>Systems should work with confidence</strong>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}