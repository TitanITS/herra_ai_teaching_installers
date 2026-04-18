import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { getCurrentPlatformUser, loginPlatform, logoutPlatform } from "../../api/auth";
import type { PlatformLoginInput, TitanPlatformUser } from "../../types/auth";

type AuthContextValue = {
    token: string | null;
    user: TitanPlatformUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (input: PlatformLoginInput) => Promise<void>;
    logout: () => void;
    refreshCurrentUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "titan_platform_token";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
    const [user, setUser] = useState<TitanPlatformUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshCurrentUser = useCallback(async () => {
        const existingToken = localStorage.getItem(STORAGE_KEY);

        if (!existingToken) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
        }

        try {
            const currentUser = await getCurrentPlatformUser(existingToken);
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
        void refreshCurrentUser();
    }, [refreshCurrentUser]);

    const login = useCallback(async (input: PlatformLoginInput) => {
        const response = await loginPlatform(input);
        localStorage.setItem(STORAGE_KEY, response.access_token);
        setToken(response.access_token);
        setUser(response.user);
    }, []);

    const logout = useCallback(() => {
        logoutPlatform();
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
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
