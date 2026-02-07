'use client';

import { createContext, useContext, useEffect, useState, useMemo, useTransition, ReactNode } from 'react';
import i18n from '../i18n/config';
import { supportedLanguages, SupportedLanguage } from '../constants/languages';

const LANGUAGE_STORAGE_KEY = 'nutriai-language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

type LanguageContextType = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  isRtl: boolean;
  availableLanguages: typeof supportedLanguages;
};

const initialContext: LanguageContextType = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => { },
  t: () => '',
  isRtl: false,
  availableLanguages: supportedLanguages,
};

const LanguageContext = createContext<LanguageContextType>(initialContext);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Initialize language from the global i18n instance (which loads from localStorage via config)
  const [language, setLanguageState] = useState<SupportedLanguage>(
    () => {
      // Get the current language from i18n, which has already initialized from localStorage
      return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
    }
  );
  const [, startTransition] = useTransition();

  // Listen for language changes from i18n and sync the context state
  useEffect(() => {
    const handleLanguageChanged = (lng: string | undefined) => {
      const newLang = (lng as SupportedLanguage) || DEFAULT_LANGUAGE;
      setLanguageState(newLang);
      // Also persist to localStorage for consistency
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    };

    // Subscribe to i18n language changes
    i18n.on('languageChanged', handleLanguageChanged);

    // Also load from localStorage if i18n hasn't restored it yet (edge case)
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && supportedLanguages.some(l => l.code === stored)) {
        const storedLang = stored as SupportedLanguage;
        if (i18n.language !== storedLang) {
          i18n.changeLanguage(storedLang);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Set language - will trigger the event listener which handles persistence
  const setLanguage = (lang: SupportedLanguage) => {
    // Optimistic update for the UI (Context consumers)
    setLanguageState(lang);

    // Defer the heavy i18n change (which triggers global re-renders for all translated components)
    startTransition(() => {
      i18n.changeLanguage(lang);
    });
  };

  // Translation function using global i18n instance
  const t = (key: string, options?: Record<string, unknown>): string => {
    return i18n.t(key, options) as string;
  };

  // Check if current language is RTL
  const currentLangData = supportedLanguages.find(l => l.code === language);
  const isRtl = (currentLangData?.dir as string) === 'rtl';

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRtl,
    availableLanguages: supportedLanguages,
  }), [language, isRtl]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// export default LanguageContext;
