/**
 * React hook for translating food names based on current locale
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedFoodName, getLocalizedFoodNames } from '../utils/foodTranslations';

/**
 * Hook that provides food name translation functions
 * based on the current i18n locale
 */
export function useFoodTranslation() {
    const { i18n } = useTranslation();

    // Memoize the current language to avoid unnecessary re-renders
    const currentLocale = useMemo(() => i18n.language, [i18n.language]);

    /**
     * Translate a single food name to the current locale
     */
    const translateFood = useCallback(
        (englishName: string): string => {
            return getLocalizedFoodName(englishName, currentLocale);
        },
        [currentLocale]
    );

    /**
     * Translate multiple food names to the current locale
     */
    const translateFoods = useCallback(
        (englishNames: string[]): string[] => {
            return getLocalizedFoodNames(englishNames, currentLocale);
        },
        [currentLocale]
    );

    return {
        translateFood,
        translateFoods,
        currentLocale,
    };
}
