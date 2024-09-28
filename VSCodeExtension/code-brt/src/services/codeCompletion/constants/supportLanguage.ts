import * as vscode from 'vscode';

import { FILE_TO_LANGUAGE_CONTEXT } from './languageMappings';

export const SUPPORTED_LANGUAGES: vscode.DocumentSelector = Object.keys(
  FILE_TO_LANGUAGE_CONTEXT,
).map((languageId) => ({
  scheme: 'file',
  language: languageId,
}));
