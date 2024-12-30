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

import vscode from 'vscode';
import { isBinaryFile } from 'isBinaryFile';

import { FileOperationsProvider } from '../../utils';

class MentionService {
  private static async readAndFormatFileContent(
    filePath: string,
  ): Promise<string> {
    try {
      const isBinary = await isBinaryFile(filePath).catch(() => false);
      if (isBinary) {
        return `Path: ${filePath}\n(Binary file, unable to display content)`;
      }
      const result = await FileOperationsProvider.readFile(filePath);
      if (result.status === 'success') {
        const fileExtension = path.extname(filePath).toLowerCase();
        return `Content in path: ${filePath}\n\`\`\`${fileExtension}\n{result.message}\n\`\`\``;
      }
      return `Path: ${filePath}\n(Failed to read file content)`;
    } catch (error) {
      return `Path: ${filePath}\n(Failed to read file content: ${error})`;
    }
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
      return [];
    }
    const result = await FileOperationsProvider.listFiles(
      workspacePath,
      true,
      100,
    );
    if (result && result.filesList) {
      return result.filesList.filter((file) => file.includes(query));
    }
    return [];
  }

  /**
   * Get the context of a file or directory.
   * If the path is a directory, the context will contain the list of files in the directory.
   * If the path is a file, the context will contain the file content.
   * @param mentionPath - The relative path of the file or directory.
   */
  public static async getFileContext(mentionPath: string): Promise<string> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      return '';
    }
    const absPath = path.resolve(workspacePath, mentionPath);

    try {
      const stats = await fs.promises.stat(absPath);

      if (stats.isFile()) {
        return MentionService.readAndFormatFileContent(absPath);
      }

      if (!stats.isDirectory()) {
        return `(Failed to read contents of ${mentionPath})`;
      }

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
            MentionService.readAndFormatFileContent(absoluteFilePath),
          );
        }
      });
      const fileContents = await Promise.all(fileContentPromises);
      return `${folderContent}\n${fileContents.join('\n\n')}`.trim();
    } catch (error) {
      return `(Failed to access path ${mentionPath}: ${error})`;
    }
  }

  public static async getProblemContext(): Promise<string> {
    // TODO: Implement problem context retrieval
    return '';
  }

  public static async getTerminalContext(): Promise<string> {
    // TODO: Implement terminal context retrieval
    return '';
  }
}

export default MentionService;
