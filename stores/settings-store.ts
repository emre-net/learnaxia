import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/i18n/dictionaries';

interface SettingsState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'tr', // Default to Turkish as requested
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'settings-store',
        }
    )
);
