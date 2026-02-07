// Supported languages configuration
export const supportedLanguages = [
    { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' as const },
    { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' as const },
    { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' as const },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' as const },
    { code: 'zh', label: '中文', flag: '🇨🇳', dir: 'ltr' as const },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳', dir: 'ltr' as const },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' as const },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];
