import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, DEFAULT_LANGUAGE } from '@learnaxia/shared';
import api, { getAuthToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'learnaxia_app_language';

interface LanguageContextValue {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (active && (stored === 'tr' || stored === 'en')) {
                    setLanguageState(stored);
                }
            } catch {
                // Non-critical storage fallback
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const userLang = user?.language;
        if (userLang === 'tr' || userLang === 'en') {
            setLanguageState(userLang);
            AsyncStorage.setItem(STORAGE_KEY, userLang).catch(() => {});
        }
    }, [user?.language]);

    const setLanguage = useCallback(async (lang: Language) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, lang);
            const token = await getAuthToken();
            if (token) {
                await api.patch('/mobile/user/account/language', { language: lang }).catch(() => {});
            }
        } catch (err) {
            if (__DEV__) console.warn('[useLanguage] Persist failed:', err);
        }
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    return useContext(LanguageContext);
}
