import axios from 'axios';

import type { ToolResponseFromToolFunction, ToolServicesApi } from './types';
import { convertHtmlToMarkdown } from './utils';

const postProcessUrlContent = (
  url: string,
  content: string,
  format: 'text' | 'json',
): ToolResponseFromToolFunction => {
  if (content.length === 0) {
    return {
      status: 'error',
      result: 'No content found at the URL. Might need to try a different URL.',
    };
  }

  if (format === 'json') {
    return {
      status: 'success',
      result: JSON.stringify(
        {
          message: `Here is the content retrieved from the URL "${url}". Use this information to answer the previously asked question.`,
          content: content,
        },
        null,
        2,
      ),
    };
  }

  return {
    status: 'success',
    result: `Content retrieved from the URL "${url}". Please use this information to answer the previously asked question:\n\n${content}`,
  };
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

    return postProcessUrlContent(url, truncatedText, format);
  } catch (error) {
    console.error('Failed to fetch the URL:', error);
    return {
      status: 'error',
      result: 'Failed to fetch the URL.',
    };
  } finally {
    updateStatus?.('');
  }
};
