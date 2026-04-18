type NotificationItem = {
    id: number;
    title: string;
    message: string;
    severity: string;
    is_active: boolean;
};

export default function TopTicker({ notifications }: { notifications: NotificationItem[] }) {
    const activeNotifications = notifications.filter((item) => item.is_active);

    if (activeNotifications.length === 0) {
        return (
            <div className="top-ticker">
                <span>Titan notifications will appear here.</span>
            </div>
        );
    }

    return (
        <div className="top-ticker">
            <div className="top-ticker__track">
                {activeNotifications.map((item) => (
                    <span key={item.id} className={`top-ticker__item top-ticker__item--${item.severity}`}>
                        <strong>{item.title}:</strong> {item.message}
                    </span>
                ))}
            </div>
        </div>
    );
}