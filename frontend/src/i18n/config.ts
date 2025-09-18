import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// @ts-ignore
import en from './locales/en.json';
// @ts-ignore
import hi from './locales/hi.json';
// @ts-ignore
import mr from './locales/mr.json';

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  },
  mr: {
    translation: mr
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'hi', // Default language is Hindi for farmers
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
    
    // Disable strict type checking for production builds
    returnNull: false,
    returnEmptyString: false,
    saveMissing: false,
    
    // TypeScript compatibility
    parseMissingKeyHandler: (key: string) => key,
  });

export default i18n;