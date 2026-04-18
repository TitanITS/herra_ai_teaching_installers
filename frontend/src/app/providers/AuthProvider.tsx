import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { getCurrentCustomerUser, loginCustomer, logoutCustomer } from "../../api/auth";

type CustomerUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role_names: string[];
    permissions: string[];
    customer_account_id: number;
    customer_account_name: string;
    is_active: boolean;
    mfa_enabled: boolean;
};

type LoginInput = {
    email: string;
    password: string;
};

type AuthContextValue = {
    token: string | null;
    user: CustomerUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (input: LoginInput) => Promise<void>;
    logout: () => void;
    refreshCurrentUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "titan_customer_token";

function parseSignedTokenPayload(token: string): Record<string, unknown> | null {
    try {
        const decoded = atob(token);
        const separatorIndex = decoded.lastIndexOf(".");

        if (separatorIndex <= 0) {
            return null;
        }

        const payloadText = decoded.slice(0, separatorIndex);
        const payload = JSON.parse(payloadText) as Record<string, unknown>;
        return payload;
    } catch {
        return null;
    }
}

function isStoredTokenUsable(token: string | null): token is string {
    if (!token) {
        return false;
    }

    const payload = parseSignedTokenPayload(token);

    if (!payload) {
        return false;
    }

    const expiresAt = payload.exp;

    if (typeof expiresAt !== "number") {
        return false;
    }

    return expiresAt > Math.floor(Date.now() / 1000);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem(STORAGE_KEY);
        return isStoredTokenUsable(storedToken) ? storedToken : null;
    });
    const [user, setUser] = useState<CustomerUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const initialRefreshCompleteRef = useRef(false);

    const refreshCurrentUser = useCallback(async () => {
        const existingToken = localStorage.getItem(STORAGE_KEY);

        if (!isStoredTokenUsable(existingToken)) {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
        }

        try {
            const currentUser = await getCurrentCustomerUser(existingToken);
            setUser(currentUser);
            setToken(existingToken);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialRefreshCompleteRef.current) {
            return;
        }

        initialRefreshCompleteRef.current = true;
        void refreshCurrentUser();
    }, [refreshCurrentUser]);

    const login = useCallback(async (input: LoginInput) => {
        const response = await loginCustomer(input);
        localStorage.setItem(STORAGE_KEY, response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        logoutCustomer();
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        setIsLoading(false);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token && user),
            isLoading,
            login,
            logout,
            refreshCurrentUser,
        }),
        [token, user, isLoading, login, logout, refreshCurrentUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}