import 'react-i18next';

// Extend the i18next module to allow any string keys
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    defaultNS: 'translation';
    resources: {
      translation: Record<string, any>;
    };
  }
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    defaultNS: 'translation';
    resources: {
      translation: Record<string, any>;
    };
  }
}
