import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import api, { getAuthToken, setAuthToken, clearAuthToken } from '../lib/api';

type User = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    handle?: string | null;
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (name: string, email: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            console.log('[AuthContext] Starting loadUser...');
            try {
                const token = await getAuthToken();
                console.log('[AuthContext] Token check:', !!token);
                if (token) {
                    try {
                        console.log('[AuthContext] Fetching profile...');
                        const res = await api.get('/mobile/user/profile');
                        console.log('[AuthContext] Profile fetched:', res.data?.id);
                        setUser(res.data);
                    } catch (error) {
                        console.error('[AuthContext] Profile fetch error:', error);
                        await logout();
                    }
                } else {
                    console.log('[AuthContext] No token found.');
                }
            } catch (error) {
                console.error('[AuthContext] loadUser error:', error);
            } finally {
                console.log('[AuthContext] Setting isLoading to false');
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login';

        console.log('[AuthContext] Redirection check:', {
            hasUser: !!user,
            inAuthGroup,
            segment: segments[0]
        });

        if (!user && !inAuthGroup) {
            // Redirect to the login page if not logged in
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to the home page if logged in
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const login = async (email: string, password?: string) => {
        try {
            const res = await api.post('/mobile/login', { email, password });
            const { token, refreshToken, user: userData } = res.data;

            await setAuthToken(token, refreshToken);
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error', error?.response?.data || error);
            throw error;
        }
    };

    const register = async (name: string, email: string, password?: string) => {
        try {
            const res = await api.post('/mobile/register', { name, email, password });
            const { token, refreshToken, user: userData } = res.data;

            await setAuthToken(token, refreshToken);
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Register error', error?.response?.data || error);
            throw error;
        }
    };

    const logout = async () => {
        await clearAuthToken();
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
