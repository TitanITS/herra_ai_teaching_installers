import SectionCard from "../common/SectionCard";
import StatusBadge from "../common/StatusBadge";

type DeploymentStatusCardProps = {
    status: string;
    version: string;
};

export default function DeploymentStatusCard({
    status,
    version,
}: DeploymentStatusCardProps) {
    return (
        <SectionCard title="Deployment Status">
            <div className="metric-line">
                <span>Status</span>
                <StatusBadge status={status} />
            </div>
            <div className="metric-line">
                <span>Version</span>
                <strong>{version}</strong>
            </div>
        </SectionCard>
    );
}