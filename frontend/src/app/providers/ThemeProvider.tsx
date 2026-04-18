import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        document.body.classList.add("titan-theme");
        return () => {
            document.body.classList.remove("titan-theme");
        };
    }, []);

    return <>{children}</>;
}