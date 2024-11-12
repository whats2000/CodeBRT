import type { BrowserIntegration, BrowserInspectResult } from './types';
import type { Browser, Page } from 'playwright';

export abstract class AbstractBrowserIntegration implements BrowserIntegration {
  protected browser?: Browser;
  protected page?: Page;
  protected consoleMessages: string[] = [];

  abstract launch(options?: { headless?: boolean }): Promise<void>;
  abstract navigate(url: string): Promise<void>;
  abstract takeScreenshot(): Promise<Buffer | null>;
  abstract getCurrentUrl(): Promise<string>;

  async getConsoleMessages(): Promise<string[]> {
    return this.consoleMessages;
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    this.consoleMessages = [];
  }

  async inspect(url: string): Promise<BrowserInspectResult> {
    await this.launch();
    await this.navigate(url);

    const screenshot = await this.takeScreenshot();
    const consoleMessages = await this.getConsoleMessages();
    const pageUrl = await this.getCurrentUrl();

    return {
      screenshot,
      consoleMessages,
      pageUrl
    };
  }
}