import { TFunction } from 'react-i18next';

// Type-safe translation helper that bypasses strict TypeScript checking
export const getTranslation = (t: TFunction) => {
  return (key: string, defaultValue?: string, options?: any): string => {
    try {
      // Use type assertion to bypass TypeScript strict mode
      return (t as any)(key, defaultValue, options) || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return defaultValue || key;
    }
  };
};

// Alternative helper for interpolation
export const getTranslationWithValues = (t: TFunction) => {
  return (key: string, values?: Record<string, any>): string => {
    try {
      return (t as any)(key, values) || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  };
};