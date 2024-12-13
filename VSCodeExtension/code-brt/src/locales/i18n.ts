import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import resources directly for fallback
import enUSCommon from './en-US/common.json';
import enUSUserGuildTours from './en-US/userGuildTours.json';
import enUpdateNotes from './en-US/updateNotes.json';
import zhTWCommon from './zh-TW/common.json';
import zhTWUserGuildTours from './zh-TW/userGuildTours.json';
import zhTWUpdateNotes from './zh-TW/updateNotes.json';
import zhCNCommon from './zh-CN/common.json';
import zhCNUserGuildTours from './zh-CN/userGuildTours.json';
import zhCNUpdateNotes from './zh-CN/updateNotes.json';

// Define supported languages
export const supportedLanguages = ['en-US', 'zh-TW', 'zh-CN'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Prepare resources with a fallback mechanism
const resources = {
  'en-US': {
    common: enUSCommon,
    userGuildTours: enUSUserGuildTours,
    updateNotes: enUpdateNotes,
  },
  'zh-TW': {
    common: zhTWCommon,
    userGuildTours: zhTWUserGuildTours,
    updateNotes: zhTWUpdateNotes,
  },
  'zh-CN': {
    common: zhCNCommon,
    userGuildTours: zhCNUserGuildTours,
    updateNotes: zhCNUpdateNotes,
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
      ns: ['common', 'userGuildTours', 'updateNotes'],
      defaultNS: 'common',

      // Debug and interpolation
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false, // React already escapes
      },

      // Load strategy
      load: 'currentOnly',
    });

  // Add error handling
  i18n.on('error', (error) => {
    console.error('i18n initialization error:', error);
  });
} catch (initError) {
  console.error('Failed to initialize i18n completely', initError);
}

export default i18n;
