import axios from 'axios';
import * as cheerio from 'cheerio';

import type { ToolResponseFromToolFunction, ToolServicesApi } from './types';
import { extractTextFromWebResponse } from './utils';

const postProcessResults = (
  results: { title: string; url: string; snippet: string }[],
  format: 'text' | 'json',
): ToolResponseFromToolFunction => {
  if (results.length === 0) {
    return {
      status: 'error',
      result: 'No search results found.',
    };
  }

  if (format === 'json') {
    return {
      status: 'success',
      result: JSON.stringify(
        {
          message: `Use the following search results to answer the previously asked question. Reference each source by its [URL] when relevant:`,
          content: results,
        },
        null,
        2,
      ),
    };
  }

  const resultContent = results
    .map(
      (result) =>
        `[TITLE] ${result.title}\n[URL] ${result.url}\n[CONTENT] ${result.snippet}`,
    )
    .join('\n\n');

  return {
    status: 'success',
    result:
      'Use the following search results to answer the previously asked question. Reference each source by its [URL] when relevant:\n\n' +
      resultContent,
  };
};

export const webSearchTool: ToolServicesApi['webSearch'] = async ({
  query,
  numResults = 4,
  maxCharsPerPage = 6000,
  format = 'text',
  updateStatus,
}) => {
  const term = query;
  numResults = Number(numResults) || 4;
  maxCharsPerPage = Number(maxCharsPerPage) || 6000;

  const allResults: { title: string; url: string; snippet: string }[] = [];
  const seenUrls = new Set<string>();

  const session = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    },
  });

  try {
    updateStatus?.(`[processing] Searching Web with keyword "${term}"`);

    const resp = await session.get('https://html.duckduckgo.com/html/', {
      params: { q: term },
      timeout: 15000,
    });

    const $ = cheerio.load(resp.data);
    const resultBlocks = $('.result');

    for (const result of resultBlocks.toArray()) {
      if (allResults.length >= numResults) break;

      const linkElement = $(result).find('a.result__a');
      const rawLink = linkElement.attr('href');
      const match = rawLink?.match(/uddg=([^&]+)/);
      const link = match ? decodeURIComponent(match[1]) : rawLink;
      const title = linkElement.text().trim();
      const snippet = $(result).find('.result__snippet').text().trim();

      if (!link || !title || !snippet || seenUrls.has(link)) continue;

      seenUrls.add(link);

      updateStatus?.(`[processing] Reading page "${title}" from ${link}`);

      try {
        const webpage = await session.get(link, { timeout: 5000 });
        const contentType = webpage.headers['content-type'];
        const visibleText = await extractTextFromWebResponse(
          webpage.data,
          contentType,
        );

        const truncatedText =
          visibleText.length > maxCharsPerPage
            ? visibleText.substring(0, maxCharsPerPage)
            : visibleText;

        allResults.push({ title, url: link, snippet: truncatedText });
      } catch (error) {
        const truncatedSnippet =
          snippet.length > maxCharsPerPage
            ? snippet.substring(0, maxCharsPerPage)
            : snippet;

        allResults.push({
          title,
          url: link,
          snippet: truncatedSnippet,
        });
      }
    }
  } catch (error) {
    console.error('Failed to search the web:', error);
  } finally {
    updateStatus?.('');
  }

  return postProcessResults(allResults, format);
};
