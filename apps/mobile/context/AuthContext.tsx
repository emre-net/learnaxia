import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import api, { getAuthToken, setAuthToken, clearAuthToken, setOnAuthFailure } from '../lib/api';
import { OfflineStorageService } from '../services/offline-storage.service';
import { UserProfile } from '@learnaxia/shared';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (name: string | undefined, email: string, password?: string, handle?: string) => Promise<void>;
    loginWithTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    loginWithTokens: async () => {},
    logout: async () => {},
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    const logout = useCallback(async () => {
        try {
            await Promise.all([
                clearAuthToken(),
                OfflineStorageService.clearAllUserData(),
            ]);
        } catch {
            // Token veya önbellek temizleme başarısız olsa bile oturumu kapat
        } finally {
            setUser(null);
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        setOnAuthFailure(() => {
            OfflineStorageService.clearAllUserData().catch(() => {});
            setUser(null);
        });
        return () => setOnAuthFailure(null);
    }, []);

    const logoutWithConfirm = useCallback(async () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: logout,
                },
            ],
            { cancelable: true }
        );
    }, [logout]);

    const refreshProfile = useCallback(async () => {
        try {
            const res = await api.get('/mobile/user/profile');
            if (res.data) {
                setUser(res.data);
            }
        } catch (error: any) {
            if (__DEV__) console.error('[AuthContext] refreshProfile error:', error);
            if (error?.response?.status === 401) {
                await logout();
            }
        }
    }, [logout]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await getAuthToken();
                if (token) {
                    const res = await api.get('/mobile/user/profile');
                    if (res.data) {
                        setUser(res.data);
                    } else {
                        await clearAuthToken();
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        if (!rootNavigationState?.key || isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading, rootNavigationState?.key, router]);

    const login = async (email: string, password?: string) => {
        const res = await api.post('/mobile/login', { email, password });
        const { accessToken, refreshToken, user: userData } = res.data;

        await setAuthToken(accessToken, refreshToken);
        setUser(userData);
        router.replace('/(tabs)');
    };

    const register = async (name: string | undefined, email: string, password?: string, handle?: string) => {
        const cleanName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : undefined;
        const cleanHandle = typeof handle === 'string' && handle.trim().length > 0 ? handle.trim() : undefined;

        const res = await api.post('/mobile/register', {
            name: cleanName,
            email: email.trim(),
            password,
            handle: cleanHandle,
        });
        const { accessToken, refreshToken, user: userData } = res.data;

        await setAuthToken(accessToken, refreshToken);
        setUser(userData);
        router.replace('/(tabs)');
    };

    const loginWithTokens = async (accessToken: string, refreshToken?: string) => {
        await setAuthToken(accessToken, refreshToken);
        const res = await api.get('/mobile/user/profile');
        if (res.data) {
            setUser(res.data);
        }
        router.replace('/(tabs)');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, loginWithTokens, logout: logoutWithConfirm, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
