import { execSync } from 'child_process';

import * as playwright from 'playwright-core';
import vscode from 'vscode';

import type { BrowserIntegration } from './types';

export class BrowserIntegrationFactory {
  private static async checkBrowserAvailability(): Promise<boolean> {
    try {
      // Try to launch a headless browser
      const browser = await playwright.chromium.launch({
        headless: true,
      });
      await browser.close();
      return true;
    } catch (error) {
      // If the browser is not available, return false
      return false;
    }
  }

  private static async ensurePlaywrightBrowsers(): Promise<void> {
    try {
      vscode.window
        .showInformationMessage(
          'This feature requires to install a chromium browser. Please install it if you want to use this feature.',
          'Install',
        )
        .then((selection) => {
          if (selection === 'Install') {
            execSync('npx playwright install-deps', { stdio: 'ignore' });
            execSync('npx playwright install chromium', { stdio: 'ignore' });
            vscode.window.showInformationMessage(
              'Chromium browser installed successfully. Retry the operation.',
            );
          }
        });
    } catch (error) {
      console.error('Failed to install Playwright browsers:', error);
      throw new Error('Unable to install Playwright browsers');
    }
  }

  static async createBrowserIntegration(
    type: 'playwright' = 'playwright',
  ): Promise<BrowserIntegration> {
    switch (type) {
      case 'playwright':
      default:
        try {
          // Check if Playwright browsers are installed
          if (!(await BrowserIntegrationFactory.checkBrowserAvailability())) {
            await BrowserIntegrationFactory.ensurePlaywrightBrowsers();
            return Promise.reject('Playwright browsers are not installed');
          }

          // Dynamically import the Playwright module
          const playwrightModule = await import('playwright-core');
          const { PlaywrightBrowserIntegration } = await import(
            './playwrightBrowserIntegration'
          );

          // Use the module to create a Playwright browser integration instance
          return new PlaywrightBrowserIntegration(playwrightModule);
        } catch (error) {
          console.error('Failed to load Playwright', error);
          throw error;
        }
    }
  }
}
