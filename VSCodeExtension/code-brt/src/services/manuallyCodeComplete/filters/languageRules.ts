import type { ManuallyCompleteLanguageInfo } from '../../../types';

export function filterByLanguageRules(
  snippets: string[],
  languageInfo: ManuallyCompleteLanguageInfo,
): string[] {
  if (!languageInfo || !languageInfo.topLevelKeywords) {
    console.warn('Invalid language info provided');
    return snippets; // 如果沒有有效的語言信息，返回原始片段
  }
  return snippets.filter((snippet) => {
    const lines = snippet.split('\n');
    return lines.some(
      (line) =>
        languageInfo.topLevelKeywords.some((keyword) =>
          line.trim().startsWith(keyword),
        ) ||
        line.trim().startsWith(languageInfo.singleLineComment) ||
        (languageInfo.builtInFunctions &&
          languageInfo.builtInFunctions.some((func) => lines.includes(func))) ||
        (languageInfo.commonLibraries &&
          languageInfo.commonLibraries.some((lib) => lines.includes(lib))),
    );
  });
}
