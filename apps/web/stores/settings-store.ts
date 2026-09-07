import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/i18n/dictionaries';

interface SettingsState {
    language: Language;
    soundEnabled: boolean;
    showStudyTimer: boolean;
    setLanguage: (lang: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setShowStudyTimer: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'tr', // Default to Turkish as requested
            soundEnabled: true,
            showStudyTimer: true,
            setLanguage: (lang) => set({ language: lang }),
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setShowStudyTimer: (enabled) => set({ showStudyTimer: enabled }),
        }),
        {
            name: 'settings-store',
        }
    )
);
