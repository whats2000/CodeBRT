/**
 * This file is referenced to https://github.com/KingNish24/OpenGPT-4o/blob/main/chatbot.py,
 * And I have made some changes to the original code to make it work with the TypeScript codebase.
 * License: MIT
 */
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
  try {
    maxCharsPerPage = Number(maxCharsPerPage);
    numResults = Number(numResults);
  } catch {
    maxCharsPerPage = 6000;
    numResults = 4;
  }

  const allResults: { title: string; url: string; snippet: string }[] = [];
  const session = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    },
  });

  try {
    updateStatus?.(`[processing] Searching Web with keyword "${term}"`);
    const resp = await session.get('https://www.google.com/search', {
      params: { q: term, num: numResults, udm: 14 },
      timeout: 5000,
    });
    const $ = cheerio.load(resp.data);
    const resultBlocks = $('div.g');

    for (const result of resultBlocks.toArray()) {
      const linkElement = $(result).find('a[href]').first();
      const link = linkElement.attr('href');
      const title = $(result).find('h3').text();
      updateStatus?.(`[processing] Reading page "${title}" from ${link}`);

      if (!link) continue;

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
        allResults.push({
          title,
          url: link,
          snippet:
            'Scraping is restricted. Use `urlFetcher` with the provided URL instead.',
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
