import { BrowserIntegration } from './types';

export class BrowserIntegrationFactory {
  static async createBrowserIntegration(
    type: 'playwright' = 'playwright',
  ): Promise<BrowserIntegration> {
    switch (type) {
      case 'playwright':
      default:
        const { PlaywrightBrowserIntegration } = await import(
          './playwrightBrowserIntegration'
        );
        return new PlaywrightBrowserIntegration();
    }
  }
}
