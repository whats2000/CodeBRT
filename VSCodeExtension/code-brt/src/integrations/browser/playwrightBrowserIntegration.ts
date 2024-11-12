import { chromium } from 'playwright';

import { AbstractBrowserIntegration } from './abstractBrowserIntegration';

export class PlaywrightBrowserIntegration extends AbstractBrowserIntegration {
  async launch(
    options: { headless?: boolean } = { headless: true },
  ): Promise<void> {
    this.browser = await chromium.launch({
      headless: options.headless,
    });
    this.page = await this.browser.newPage();

    this.page.on('console', (msg) => {
      this.consoleMessages.push(msg.text());
    });
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
}
