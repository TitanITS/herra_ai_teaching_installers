import SectionCard from "../common/SectionCard";

type TokenUsageCardProps = {
    purchased: number;
    used: number;
    remaining: number;
};

export default function TokenUsageCard({
    purchased,
    used,
    remaining,
}: TokenUsageCardProps) {
    return (
        <SectionCard title="Token Usage">
            <div className="metric-line">
                <span>Purchased</span>
                <strong>{purchased.toLocaleString()}</strong>
            </div>
            <div className="metric-line">
                <span>Used</span>
                <strong>{used.toLocaleString()}</strong>
            </div>
            <div className="metric-line">
                <span>Remaining</span>
                <strong>{remaining.toLocaleString()}</strong>
            </div>
        </SectionCard>
    );
}