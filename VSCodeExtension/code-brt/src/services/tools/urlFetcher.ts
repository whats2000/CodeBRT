import axios from 'axios';

import type { ToolServicesApi } from './types';
import { convertHtmlToMarkdown } from './utils';

const postProcessUrlContent = (
  content: string,
  format: 'text' | 'json',
): string => {
  if (format === 'json') {
    return JSON.stringify({ content }, null, 2);
  }

  return '#####\nExtracted Content from URL:\n\n' + content;
};

export const urlFetcherTool: ToolServicesApi['urlFetcher'] = async ({
  url,
  maxCharsPerPage = 6000,
  format = 'text',
  updateStatus,
}) => {
  try {
    maxCharsPerPage = Number(maxCharsPerPage);
  } catch (error) {
    maxCharsPerPage = 6000;
  }

  const session = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    },
  });

  try {
    updateStatus?.(`[processing] Fetching content from URL "${url}"`);
    const resp = await session.get(url, { timeout: 5000 });
    const visibleText = convertHtmlToMarkdown(resp.data);
    const truncatedText =
      visibleText.length > maxCharsPerPage
        ? visibleText.substring(0, maxCharsPerPage)
        : visibleText;

    updateStatus?.('');
    return postProcessUrlContent(truncatedText, format);
  } catch (error) {
    console.error('Failed to fetch the URL:', error);
    return 'Failed to fetch the URL content.';
  }
};
