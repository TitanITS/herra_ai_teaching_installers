type SectionCardProps = {
    title?: string;
    children: React.ReactNode;
};

export default function SectionCard({ title, children }: SectionCardProps) {
    return (
        <section className="section-card">
            {title ? <h2 className="section-card__title">{title}</h2> : null}
            {children}
        </section>
    );
}