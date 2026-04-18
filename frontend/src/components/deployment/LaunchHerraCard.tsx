import SectionCard from "../common/SectionCard";

type LaunchHerraCardProps = {
    launchUrl: string;
};

export default function LaunchHerraCard({ launchUrl }: LaunchHerraCardProps) {
    return (
        <SectionCard title="Launch Herra">
            <p className="card-copy">
                Open the managed Herra deployment directly from your Titan customer portal.
            </p>
            <a className="primary-button button-link" href={launchUrl} target="_blank" rel="noreferrer">
                Launch Herra
            </a>
        </SectionCard>
    );
}