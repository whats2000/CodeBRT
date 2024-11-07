/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/services/ripgrep/index.ts
 */
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

import vscode from 'vscode';

import type { SearchResult } from './types/SearchContext';
import { DIRS_TO_IGNORE } from './constants';

const isWindows = /^win/.test(process.platform);
const binName = isWindows ? 'rg.exe' : 'rg';

async function getBinPath(vscodeAppRoot: string): Promise<string | undefined> {
  const checkPath = async (pkgFolder: string) => {
    const fullPath = path.join(vscodeAppRoot, pkgFolder, binName);
    return (await pathExists(fullPath)) ? fullPath : undefined;
  };

  return (
    (await checkPath('node_modules/@vscode/ripgrep/bin/')) ||
    (await checkPath('node_modules/vscode-ripgrep/bin')) ||
    (await checkPath('node_modules.asar.unpacked/vscode-ripgrep/bin/')) ||
    (await checkPath('node_modules.asar.unpacked/@vscode/ripgrep/bin/'))
  );
}

async function pathExists(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(path, (err) => {
      resolve(err === null);
    });
  });
}

async function execRipgrep(bin: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const rgProcess = childProcess.spawn(bin, args);
    const rl = readline.createInterface({
      input: rgProcess.stdout,
      crlfDelay: Infinity,
    });

    let output = '';
    const MAX_RESULTS = 300;
    let lineCount = 0;

    rl.on('line', (line) => {
      if (lineCount < MAX_RESULTS) {
        output += line + '\n';
        lineCount++;
      } else {
        rl.close();
        rgProcess.kill();
      }
    });

    let errorOutput = '';
    rgProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    rl.on('close', () => {
      if (errorOutput) {
        reject(new Error(`ripgrep process error: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });

    rgProcess.on('error', (error) => {
      reject(new Error(`ripgrep process error: ${error.message}`));
    });
  });
}

export const searchFiles = async (
  dirPath: string,
  currentWorkspacePath: string,
  regex: string,
  filePattern: string = '*',
): Promise<{
  status: 'success' | 'error';
  results?: SearchResult[];
  message?: string;
}> => {
  try {
    const rgPath = await getBinPath(vscode.env.appRoot);

    if (!rgPath) {
      return {
        status: 'error',
        message: 'Ripgrep binary not found, the vscode-ripgrep is missing.',
      };
    }

    const args = [
      '--json',
      '-e',
      regex,
      '--glob',
      filePattern,
      '--context',
      '1', // Specifies 1 line of context before and after matches
      dirPath,
    ];

    // Add exclusion arguments for each directory in DIRS_TO_IGNORE
    for (const dir of DIRS_TO_IGNORE) {
      args.push(`--glob`, `!${dir}/**`);
    }

    const output = await execRipgrep(rgPath, args);

    const results: SearchResult[] = [];
    let currentResult: Partial<SearchResult> | null = null;

    output.split('\n').forEach((line) => {
      if (line) {
        try {
          const parsed = JSON.parse(line);

          if (parsed.type === 'match') {
            // Finalize and push the previous result
            if (currentResult) {
              results.push(currentResult as SearchResult);
            }

            currentResult = {
              file: path.relative(currentWorkspacePath, parsed.data.path.text),
              line: parsed.data.line_number,
              column: parsed.data.submatches[0].start,
              match: parsed.data.lines.text,
              beforeContext: [],
              afterContext: [],
            };
          } else if (parsed.type === 'context' && currentResult) {
            // Add context lines
            if (parsed.data.line_number < currentResult.line!) {
              currentResult.beforeContext!.push(parsed.data.lines.text);
            } else {
              currentResult.afterContext!.push(parsed.data.lines.text);
            }
          }
        } catch (error) {
          console.error('Error parsing ripgrep output:', error);
        }
      }
    });

    // Push the final result if it exists
    if (currentResult) {
      results.push(currentResult as SearchResult);
    }

    return {
      status: 'success',
      results,
    };
  } catch (error) {
    console.error(`Error in searchFiles: ${error}`);
    return {
      status: 'error',
      message: `Failed to perform search: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
