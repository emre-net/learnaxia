import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/i18n/dictionaries';

interface SettingsState {
    language: Language;
    soundEnabled: boolean;
    setLanguage: (lang: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'tr', // Default to Turkish as requested
            soundEnabled: true,
            setLanguage: (lang) => set({ language: lang }),
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
        }),
        {
            name: 'settings-store',
        }
    )
);
