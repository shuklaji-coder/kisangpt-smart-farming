import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// @ts-ignore
import en from './locales/en.json';
// @ts-ignore
import hi from './locales/hi.json';
// @ts-ignore
import mr from './locales/mr.json';
// @ts-ignore
import pa from './locales/pa.json';
// @ts-ignore
import bn from './locales/bn.json';

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  },
  mr: {
    translation: mr
  },
  pa: {
    translation: pa
  },
  bn: {
    translation: bn
  }
};

// Determine initial language: prefer saved value, then browser language, then Hindi
const getInitialLanguage = (): string => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('appLanguage');
      if (saved && resources[saved as keyof typeof resources]) return saved;
    }
  } catch {}
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const two = navigator.language.slice(0, 2);
      if (resources[two as keyof typeof resources]) return two;
    }
  } catch {}
  return 'hi';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: false,
    parseMissingKeyHandler: (key: string) => key,
  });

// Persist language changes
try {
  i18n.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('appLanguage', lng);
      try {
        document.documentElement.setAttribute('lang', lng);
      } catch {}
    }
  });
} catch {}

export default i18n;
