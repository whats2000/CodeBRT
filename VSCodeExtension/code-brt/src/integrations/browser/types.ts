export type BrowserInspectResult = {
  screenshot: Buffer | null;
  consoleMessages: string[];
  pageUrl: string;
};

export type BrowserIntegration = {
  launch(options?: { headless?: boolean }): Promise<void>;
  navigate(url: string): Promise<void>;
  takeScreenshot(): Promise<Buffer | null>;
  getConsoleMessages(): Promise<string[]>;
  close(): Promise<void>;
  getCurrentUrl(): Promise<string>;
  inspect(url: string): Promise<BrowserInspectResult>;
};
