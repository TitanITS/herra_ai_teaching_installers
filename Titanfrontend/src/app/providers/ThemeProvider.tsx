import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
    return <div className="titan-theme">{children}</div>;
}
