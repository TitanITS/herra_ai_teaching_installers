import SectionCard from "../common/SectionCard";

type AccountManagerCardProps = {
    name: string;
    title: string;
    email: string;
    phone: string;
};

export default function AccountManagerCard({
    name,
    title,
    email,
    phone,
}: AccountManagerCardProps) {
    return (
        <SectionCard title="Account Manager">
            <div className="metric-line">
                <span>Name</span>
                <strong>{name}</strong>
            </div>
            <div className="metric-line">
                <span>Title</span>
                <strong>{title}</strong>
            </div>
            <div className="metric-line">
                <span>Email</span>
                <strong>{email}</strong>
            </div>
            <div className="metric-line">
                <span>Phone</span>
                <strong>{phone}</strong>
            </div>
        </SectionCard>
    );
}