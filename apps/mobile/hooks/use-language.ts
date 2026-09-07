/**
 * useLanguage — Uygulama genelinde dil yönetimi için merkezi hook.
 *
 * Şu an için: Kullanıcı profili veya AsyncStorage'dan dil okur.
 * Yoksa cihaz dilini dener; Türkçe ise 'tr', değilse 'en' kullanır.
 * İleride: Kullanıcı profil API'sinden dinamik olarak güncellenir.
 */

import { useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Language } from '@learnaxia/shared';

const LANGUAGE_KEY = 'learnaxia_language';
const DEFAULT_LANGUAGE: Language = 'tr';

/** Cihaz dilini okur ve desteklenen bir dile çevirir */
function getDeviceLanguage(): Language {
  try {
    const locale: string =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
          'tr'
        : NativeModules.I18nManager?.localeIdentifier || 'tr';

    const lang = locale.substring(0, 2).toLowerCase();
    return lang === 'tr' ? 'tr' : 'en';
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved === 'tr' || saved === 'en') {
          setLanguageState(saved as Language);
        } else {
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
        }
      } catch {
        setLanguageState(DEFAULT_LANGUAGE);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language): Promise<void> => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch {
      // Hata durumunda state güncelleme yine de yapılır
      setLanguageState(lang);
    }
  };

  return { language, setLanguage };
}
