import { t, Language } from '@learnaxia/shared';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * Hook to use translations in components.
 * Automatically picks up the language from settings-store.
 */
export const useTranslation = () => {
    const { language } = useSettingsStore();

    return {
        t: (key: string, params?: Record<string, string | number>) => t(key, language as Language, params),
        language
    };
};

export { t, type Language };
