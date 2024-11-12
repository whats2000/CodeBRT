import { BrowserIntegration } from './types';

export class BrowserIntegrationFactory {
  static async createBrowserIntegration(
    type: 'playwright' = 'playwright',
  ): Promise<BrowserIntegration> {
    switch (type) {
      case 'playwright':
      default:
        try {
          // Dynamically import the Playwright module
          const playwrightModule = await import('playwright-core');
          const { PlaywrightBrowserIntegration } = await import(
            './playwrightBrowserIntegration'
          );

          // Return a new Playwright browser integration instance
          return new PlaywrightBrowserIntegration(playwrightModule);
        } catch (error) {
          console.error('Failed to load Playwright', error);
          throw error;
        }
    }
  }
}
