'use client';


import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { SupportedLanguage } from '../../i18n/config';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon' | 'full';
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSwitcher({
  variant = 'button',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { t } = useTranslation('language');
  const { language, setLanguage, availableLanguages } = useLanguage();

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    onLanguageChange?.(langCode);
  };

  const currentLanguage = availableLanguages.find((l) => l.code === language);

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Globe className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Select language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'full') {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('select')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${language === lang.code
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {lang.label}
              </span>
              {language === lang.code && (
                <Check className="ml-auto h-4 w-4 text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.label}</span>
          <Globe className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center gap-2"
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact language indicator for header
export function LanguageIndicator() {
  const { language, availableLanguages } = useLanguage();
  const currentLang = availableLanguages.find((l) => l.code === language);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <span>{currentLang?.flag || '🌐'}</span>
      <span className="hidden sm:inline">{currentLang?.label}</span>
    </div>
  );
}
