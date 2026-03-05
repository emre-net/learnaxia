import { getDictionary, Language } from './dictionaries';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * Translates a key into the given language.
 * Supports nested keys like 'common.cancel'
 */
export const t = (key: string, lang: Language, params?: Record<string, string | number>) => {
    const dict = getDictionary(lang);
    const keys = key.split('.');
    let value: any = dict;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            console.warn(`[i18n] Key not found: ${key} in ${lang}`);
            return key;
        }
    }

    if (typeof value !== 'string') {
        console.warn(`[i18n] Key is not a string: ${key} in ${lang}`);
        return key;
    }

    // Handle parameters (e.g., {count})
    if (params) {
        let result = value;
        Object.entries(params).forEach(([k, v]) => {
            result = result.replace(`{${k}}`, String(v));
        });
        return result;
    }

    return value;
};

/**
 * Hook to use translations in components.
 * Automatically picks up the language from settings-store.
 */
export const useTranslation = () => {
    const { language } = useSettingsStore();

    return {
        t: (key: string, params?: Record<string, string | number>) => t(key, language, params),
        language
    };
};
