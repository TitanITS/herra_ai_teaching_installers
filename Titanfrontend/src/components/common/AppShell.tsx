export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-shell">
            <div className="app-shell__backdrop">
                <div className="app-shell__ghost-logo" />
            </div>
            <div className="app-shell__content">{children}</div>
        </div>
    );
}