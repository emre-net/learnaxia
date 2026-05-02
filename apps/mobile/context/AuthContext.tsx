import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import api, { getAuthToken, setAuthToken, clearAuthToken } from '../lib/api';
import { UserProfile } from '@learnaxia/shared';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (name: string, email: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    const logout = useCallback(async () => {
        await clearAuthToken();
        setUser(null);
        router.replace('/login');
    }, [router]);

    const refreshProfile = useCallback(async () => {
        try {
            const res = await api.get('/mobile/user/profile');
            setUser(res.data);
        } catch (error) {
            console.error('[AuthContext] refreshProfile error:', error);
            await logout();
        }
    }, [logout]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await getAuthToken();
                if (token) {
                    await refreshProfile();
                }
            } catch (error) {
                console.error('[AuthContext] loadUser error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, [refreshProfile]);

    useEffect(() => {
        // Wait until navigation is fully mounted and user data is loaded
        if (!rootNavigationState?.key || isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading, rootNavigationState?.key, router]);

    const login = async (email: string, password?: string) => {
        try {
            const res = await api.post('/mobile/login', { email, password });
            const { accessToken, refreshToken, user: userData } = res.data;

            await setAuthToken(accessToken, refreshToken);
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error', error);
            throw error;
        }
    };

    const register = async (name: string, email: string, password?: string) => {
        try {
            const res = await api.post('/mobile/register', { name, email, password });
            const { accessToken, refreshToken, user: userData } = res.data;

            await setAuthToken(accessToken, refreshToken);
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Register error', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
