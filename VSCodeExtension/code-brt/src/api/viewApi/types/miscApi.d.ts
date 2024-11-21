import { ToolCallEntry, ToolCallResponse } from '../../../types';

export type MiscApi = {
  /**
   * Show an alert message.
   * @param msg - The message to show.
   * @param type - The type of the message in ["info", "warning", "error"]
   * @param selections - The selections to show.
   * And invoke the command when selected.
   */
  alertMessage: (
    msg: string,
    type: 'info' | 'warning' | 'error',
    selections?: {
      text: string;
      commandArgs: string[];
    }[],
  ) => void;

  /**
   * Get the response for a query with a file.
   * @param base64Data - The base64 data of the file.
   * @param originalFileName - The original filename.
   * @returns The path of the file.
   */
  uploadFile: (base64Data: string, originalFileName: string) => Promise<string>;

  /**
   * Delete an image.
   * @param filePath - The path of the file to delete.
   * Only work for user uploaded files.
   */
  deleteFile: (filePath: string) => Promise<void>;

  /**
   * Get the webview URI for a path.
   * @param absolutePath - The absolute path to get the URI for.
   */
  getWebviewUri: (absolutePath: string) => Promise<string>;

  /**
   * Open an external link in the default browser.
   * @param url - The URL to open.
   */
  openExternalLink: (url: string) => Promise<void>;

  /**
   * Open the keyboard shortcut settings for specific command.
   * @param commandId - The command ID to open the keyboard shortcut settings for.
   */
  openKeyboardShortcuts: (commandId: string) => Promise<void>;

  /**
   * Open marketplace page for target extension.
   * @param extensionId - The extension ID to open the marketplace page for.
   */
  openExtensionMarketplace: (extensionId: string) => Promise<void>;

  /**
   * Approve the tool call.
   * @param toolCall - The tool call to approve.
   * @returns The response of the tool call.
   */
  approveToolCall: (toolCall: ToolCallEntry) => Promise<ToolCallResponse>;

  /**
   * Run a command in the terminal.
   * @param command - The command to run
   * @param relativePath - The relative path to run the command in
   */
  runCommand: (command: string, relativePath?: string) => Promise<void>;

  /**
   * Close the diff view.
   */
  closeDiffView: () => void;
};
