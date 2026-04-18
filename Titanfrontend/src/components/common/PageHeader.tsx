type PageHeaderProps = {
    title: string;
    subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
    const hasSubtitle = Boolean(subtitle && subtitle.trim());

    return (
        <div className="page-header">
            <h1>{title}</h1>
            {hasSubtitle ? <p>{subtitle}</p> : null}
        </div>
    );
}