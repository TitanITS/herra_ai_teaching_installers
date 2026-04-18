import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";

export function usePermissions() {
    const { user } = useAuth();

    return useMemo(() => {
        const permissions = new Set(user?.permissions ?? []);

        return {
            permissions,
            hasPermission: (permission: string) => permissions.has(permission),
        };
    }, [user]);
}