/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/core/mentions/index.ts
 */
import fs from 'fs';
import path from 'path';

import vscode, { DiagnosticSeverity } from 'vscode';
import { isBinaryFile } from 'isBinaryFile';

import { FileOperationsProvider } from '../../utils';

class MentionService {
  private static async readAndFormatFileContent(
    relativePath: string,
    absolutePath: string,
  ): Promise<string> {
    try {
      const isBinary = await isBinaryFile(absolutePath).catch(() => false);
      if (isBinary) {
        return `Path: ${relativePath}\n(Binary file, unable to display content)`;
      }
      const result = await FileOperationsProvider.readFile(absolutePath);
      if (result.status === 'success') {
        const fileExtension = absolutePath.split('.').pop();
        // Be sure to place the content in a code block
        return `Path: ${relativePath}\n\`\`\`${fileExtension}\n${result.message}\n\`\`\``;
      }
      return `Path: ${relativePath}\n(Failed to read file content)`;
    } catch (error) {
      return `Path: ${relativePath}\n(Failed to read file content: ${error})`;
    }
  }

  private static async getWorkspaceDiagnostics(): Promise<string> {
    // Retrieve an array of [Uri, Diagnostic[]]
    const diagnosticsArray = vscode.languages.getDiagnostics();

    // If empty or undefined, return a fallback message.
    if (!diagnosticsArray || diagnosticsArray.length === 0) {
      return `## Workspace Diagnostics\n\nNo diagnostics found in the workspace.`;
    }

    let output = `## Workspace Diagnostics\n\n`;

    for (const [uri, diagnostics] of diagnosticsArray) {
      // If a file has zero diagnostics, skip it.
      if (diagnostics.length === 0) {
        continue;
      }

      output += `**File:** \`${uri.fsPath}\`\n\n`;
      for (const diag of diagnostics) {
        const severity = DiagnosticSeverity[diag.severity];
        const line = diag.range.start.line + 1; // 1-based indexing
        const character = diag.range.start.character + 1; // 1-based indexing
        const message = diag.message.replace(/\r?\n|\r/g, ' '); // Flatten multiline

        output += `- [${severity}] Line ${line}, Col ${character}: ${message}\n`;
      }
      output += `\n`; // Extra spacing between files
    }

    // If the loop finishes and nothing was added, that means no file had any diagnostics.
    if (output === `## Workspace Diagnostics\n\n`) {
      output += `No diagnostics found in the workspace.`;
    }

    return output.trim();
  }

  /**
   * Get the list of files or directories in the workspace that match the query. This is used for mention suggestions.
   * @param query - The query to filter the files or directories.
   */
  public static async getFilesOrDirectoriesList(
    query: string,
  ): Promise<string[]> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      console.error('No workspace path found');
      return [];
    }
    const cleanQuery = query.replace(/^(file:|folder:)/, '');
    const result = await FileOperationsProvider.listFiles(
      workspacePath,
      true,
      100,
      cleanQuery,
    );
    if (result && result.filesList) {
      return result.filesList.filter((file) => file.includes(query));
    }
    return [];
  }

  /**
   * Get the context of a file or directory (single path).
   * If the path is a directory, the context will contain the list of files in that directory
   * plus the content of those files.
   * If the path is a file, the context will contain the file content.
   * @param singleMention - The relative path of the file or directory mention.
   *                        It should be `#file:<path>` or `#folder:<path>`.
   * @returns The context of the file or directory.
   */
  public static async getFileContext(singleMention: string): Promise<string> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      return '';
    }
    const isFolder = singleMention.startsWith('#folder:');
    const relativePath = singleMention.replace(/#(file|folder):/, '').trim();
    const absPath = path.resolve(workspacePath, relativePath);

    try {
      if (!isFolder) {
        return this.readAndFormatFileContent(relativePath, absPath);
      }

      // Directory flow:
      const entries = await fs.promises.readdir(absPath, {
        withFileTypes: true,
      });
      let folderContent = '';
      const fileContentPromises: Promise<string>[] = [];
      entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1;
        const linePrefix = isLast ? '└── ' : '├── ';
        if (!entry.isFile()) {
          if (entry.isDirectory()) {
            folderContent += `${linePrefix}${entry.name}/\n`;
          } else {
            folderContent += `${linePrefix}${entry.name}\n`;
          }
        } else {
          folderContent += `${linePrefix}${entry.name}\n`;
          const absoluteFilePath = path.resolve(absPath, entry.name);
          fileContentPromises.push(
            this.readAndFormatFileContent(
              relativePath + '/' + entry.name,
              absoluteFilePath,
            ),
          );
        }
      });
      const fileContents = await Promise.all(fileContentPromises);
      return `\`\`\`\n${folderContent}\`\`\`\n${fileContents.join('\n\n')}`.trim();
    } catch (error) {
      return `(Failed to access path ${singleMention}: ${error})`;
    }
  }

  /**
   * Get the contexts of multiple files or directories.
   * Each path's context is wrapped and labeled for clarity, so a large language model
   * can easily reference the corresponding context.
   * @param mentions - Array of relative file or directory mentions.
   */
  public static async getFileContexts(mentions: string[]): Promise<string> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      return '';
    }

    const contexts: string[] = [];

    for (const singleMention of mentions) {
      try {
        const context = await this.getFileContext(singleMention);
        // Wrap each path context with a heading or bracketed label
        contexts.push(`### Content for: \`${singleMention}\`\n\n${context}`);
      } catch (error) {
        contexts.push(
          `### Content for: \`${singleMention}\`\n\n(Failed to retrieve content: ${error})`,
        );
      }
    }

    // Join them all together, separated by blank lines.
    return contexts.join('\n\n');
  }

  /**
   * Get a summary of all Diagnostics (Problems) in the workspace.
   * This method collects errors/warnings/etc. from all files.
   * @param singleMention - The mention to trigger this method.
   * @returns A formatted string summarizing all problems (LLM-friendly).
   */
  public static async getProblemContext(
    singleMention: string,
  ): Promise<string> {
    if (singleMention.startsWith('@problem:workspace')) {
      return this.getWorkspaceDiagnostics();
    } else if (singleMention.startsWith('@problem:terminal')) {
      return 'Currently, terminal problems are not supported.';
    }

    // If the mention is not recognized
    return 'Unknown problem context mention.';
  }

  /**
   * Get the context of problem mentions.
   * @param mentions - The mentions to get the context for.
   */
  public static async getProblemsContext(mentions: string[]): Promise<string> {
    const contexts: string[] = [];

    for (const singleMention of mentions) {
      try {
        const context = await this.getProblemContext(singleMention);
        // Wrap each path context with a heading or bracketed label
        contexts.push(`### Problems for: \`${singleMention}\`\n\n${context}`);
      } catch (error) {
        contexts.push(
          `### Problems for: \`${singleMention}\`\n\n(Failed to retrieve content: ${error})`,
        );
      }
    }

    // Join them all together, separated by blank lines.
    return contexts.join('\n\n');
  }
}

export default MentionService;
