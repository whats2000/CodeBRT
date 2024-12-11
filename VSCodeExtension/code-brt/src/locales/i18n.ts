import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import resources directly for fallback
import enUSCommon from './en-US/common.json';
import enUSUserGuildTours from './en-US/userGuildTours.json';
import zhTWCommon from './zh-TW/common.json';
import zhTWUserGuildTours from './zh-TW/userGuildTours.json';
import zhCNCommon from './zh-CN/common.json';
import zhCNUserGuildTours from './zh-CN/userGuildTours.json';

// Define supported languages
export const supportedLanguages = ['en-US', 'zh-TW', 'zh-CN'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Prepare resources with a fallback mechanism
const resources = {
  'en-US': {
    common: enUSCommon,
    userGuildTours: enUSUserGuildTours,
  },
  'zh-TW': {
    common: zhTWCommon,
    userGuildTours: zhTWUserGuildTours,
  },
  'zh-CN': {
    common: zhCNCommon,
    userGuildTours: zhCNUserGuildTours,
  },
};

try {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      // Inline resources as a fallback
      resources,

      // Language configuration
      fallbackLng: 'en-US',
      supportedLngs: supportedLanguages,

      // Namespaces
      ns: ['common', 'userGuildTours'],
      defaultNS: 'common',

      // Debug and interpolation
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false, // React already escapes
      },
    });

  // Add error handling
  i18n.on('error', (error) => {
    console.error('i18n initialization error:', error);
  });
} catch (initError) {
  console.error('Failed to initialize i18n completely', initError);
}

export default i18n;
