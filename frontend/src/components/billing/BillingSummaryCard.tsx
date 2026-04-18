import SectionCard from "../common/SectionCard";

type BillingSummaryCardProps = {
    monthlyEstimate: number;
};

export default function BillingSummaryCard({ monthlyEstimate }: BillingSummaryCardProps) {
    return (
        <SectionCard title="Billing Snapshot">
            <div className="metric-line">
                <span>Estimated Monthly Billing</span>
                <strong>${monthlyEstimate.toFixed(2)}</strong>
            </div>
        </SectionCard>
    );
}