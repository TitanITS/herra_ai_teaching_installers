type TopTickerProps = {
    notifications: string[];
};

export default function TopTicker({ notifications }: TopTickerProps) {
    return (
        <section className="top-ticker" aria-label="Titan status ticker">
            <div className="top-ticker__track">
                {notifications.map((notification, index) => (
                    <div className="top-ticker__item" key={`${notification}-${index}`}>
                        {notification}
                    </div>
                ))}
            </div>
        </section>
    );
}
