import { AbstractBrowserIntegration } from './abstractBrowserIntegration';

export class PlaywrightBrowserIntegration extends AbstractBrowserIntegration {
  private chromium: any;

  constructor(playwrightModule: any) {
    super();
    this.chromium = playwrightModule.chromium;
  }

  async launch(
    options: { headless?: boolean } = { headless: true },
  ): Promise<void> {
    try {
      this.browser = await this.chromium.launch({
        headless: options.headless,
      });
      this.page = await this.browser?.newPage();

      this.page?.on('console', (msg) => {
        this.consoleMessages.push(msg.text());
      });
    } catch (error) {
      console.error('Playwright launch failed:', error);
      throw error;
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) await this.launch();
    await this.page!.goto(url, { waitUntil: 'networkidle' });
  }

  async takeScreenshot(): Promise<Buffer | null> {
    return this.page ? this.page.screenshot() : null;
  }

  async getCurrentUrl(): Promise<string> {
    return this.page ? this.page.url() : '';
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }
}
