import { convertHtmlToMarkdown } from './crawlerToolConverter';

/**
 * Extracts text from web response data based on content type.
 * @param data - The raw data from the web response.
 * @param contentType - The content type of the data.
 * @returns Extracted visible text.
 */
export const extractTextFromWebResponse = async (
  data: any,
  contentType: string,
): Promise<string> => {
  let visibleText = '';
  const mainContentType = contentType.split(';')[0].trim();

  try {
    switch (mainContentType) {
      case 'text/html':
        visibleText = convertHtmlToMarkdown(data);
        break;
      default:
        visibleText =
          'Unsupported content format. Tell user to check the link directly.';
    }

    return visibleText;
  } catch (error) {
    return 'There was an error extracting text from this content.';
  }
};
