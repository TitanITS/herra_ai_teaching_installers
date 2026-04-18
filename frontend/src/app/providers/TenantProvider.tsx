import {
    createContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { getAccountManager, getCustomerAccount, getDashboardSummary } from "../../api/accounts";
import { getNotifications } from "../../api/notifications";
import { useAuth } from "../../hooks/auth/useAuth";

type TenantContextValue = {
    account: any | null;
    dashboardSummary: any | null;
    notifications: any[];
    accountManager: any | null;
    isLoading: boolean;
    reloadTenantData: () => Promise<void>;
};

export const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = useAuth();
    const [account, setAccount] = useState<any | null>(null);
    const [dashboardSummary, setDashboardSummary] = useState<any | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [accountManager, setAccountManager] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const reloadTenantData = async () => {
        if (!token || !isAuthenticated) {
            setAccount(null);
            setDashboardSummary(null);
            setNotifications([]);
            setAccountManager(null);
            return;
        }

        setIsLoading(true);
        try {
            const [accountData, summaryData, notificationData, managerData] = await Promise.all([
                getCustomerAccount(token),
                getDashboardSummary(token),
                getNotifications(token),
                getAccountManager(token),
            ]);

            setAccount(accountData);
            setDashboardSummary(summaryData);
            setNotifications(notificationData);
            setAccountManager(managerData);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void reloadTenantData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAuthenticated]);

    const value = useMemo<TenantContextValue>(
        () => ({
            account,
            dashboardSummary,
            notifications,
            accountManager,
            isLoading,
            reloadTenantData,
        }),
        [account, dashboardSummary, notifications, accountManager, isLoading],
    );

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}