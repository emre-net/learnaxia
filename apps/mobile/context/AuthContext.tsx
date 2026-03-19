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
            try {
                const token = await getAuthToken();
                if (token) {
                    try {
                        const res = await api.get('/mobile/user/profile');
                        setUser(res.data);
                    } catch (error) {
                        await logout();
                    }
                }
            } catch (error) {
                console.error('[AuthContext] loadUser error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login';

        if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const login = async (email: string, password?: string) => {
        try {
            const res = await api.post('/mobile/login', { email, password });
            const { accessToken, refreshToken, user: userData } = res.data;

            await setAuthToken(accessToken, refreshToken);
            setUser(userData);
            router.replace('/(tabs)');
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                console.error('Login error', axiosError.response?.data || axiosError);
            } else {
                console.error('Login error', error);
            }
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
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                console.error('Register error', axiosError.response?.data || axiosError);
            } else {
                console.error('Register error', error);
            }
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
