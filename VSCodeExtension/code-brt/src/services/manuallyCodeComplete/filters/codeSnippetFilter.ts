import type { ManuallyCompleteLanguageInfo } from '../../../types';
import {
  extractCodeBetweenTags,
  filterByIndentation,
} from './extractionMethods';
import { filterByLanguageRules } from './languageRules';
import { removeDuplicates } from './utils';
import { Constants } from '../constants';

export function filterCodeSnippets(
  response: string,
  languageId: string,
): string[] {
  console.log('Original response:', response);
  console.log('Language ID:', languageId);

  const languageInfo: ManuallyCompleteLanguageInfo = Constants[languageId];
  if (!languageInfo) {
    console.warn(`Language info not found for ${languageId}`);
    return [response];
  }
  console.log('Language Info:', languageInfo);

  try {
    let snippets = extractCodeBetweenTags(response);
    console.log('Snippets after extractCodeBetweenTags:', snippets);

    if (snippets.length === 0) {
      snippets = filterByIndentation(response);
      console.log('Snippets after filterByIndentation:', snippets);
    }

    snippets = filterByLanguageRules(snippets, languageInfo);
    console.log('Snippets after filterByLanguageRules:', snippets);

    const finalSnippets = removeDuplicates(snippets);
    console.log('Final snippets:', finalSnippets);

    if (finalSnippets.length === 0) {
      console.log('No snippets after filtering, returning original response');
      return [response];
    }

    return finalSnippets;
  } catch (error) {
    console.error('Error in filterCodeSnippets:', error);
    return [response];
  }
}
