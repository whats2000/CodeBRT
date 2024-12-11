import Resources from './resource';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof Resources;
    defaultNS: 'translation';
    fallbackNS: 'translation';
  }
}
