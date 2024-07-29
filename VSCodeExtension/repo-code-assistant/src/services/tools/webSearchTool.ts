/**
 * This file is referenced to https://github.com/KingNish24/OpenGPT-4o/blob/main/chatbot.py
 * And I have made some changes to the original code to make it work with the TypeScript codebase.
 * License: MIT
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

import type { ToolServicesApi } from '../../types';

const extractTextFromWebpage = (htmlContent: string): string => {
  const $ = cheerio.load(htmlContent);
  $('script, style, header, footer, nav, form, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
};

const postProcessResults = (
  results: { title: string; url: string; snippet: string }[],
): string => {
  return (
    '#####\nWeb Search Results is at below, please answer and provide reference links:\n\n' +
    results
      .map(
        (result) =>
          `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}\n`,
      )
      .join('\n')
  );
};

export const webSearchTool: ToolServicesApi['webSearch'] = async ({
  query,
  updateStatus,
  maxCharsPerPage = 6000,
  numResults = 4,
}) => {
  const term = query;
  const allResults: { title: string; url: string; snippet: string }[] = [];
  const session = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    },
  });

  try {
    updateStatus?.('[Searching] Searching Web');
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
      if (!link) {
        continue;
      }
      try {
        const webpage = await session.get(link, { timeout: 5000 });
        const visibleText = extractTextFromWebpage(webpage.data);
        const truncatedText =
          visibleText.length > maxCharsPerPage
            ? visibleText.substring(0, maxCharsPerPage)
            : visibleText;
        allResults.push({ title, url: link, snippet: truncatedText });
      } catch (error) {
        allResults.push({ title, url: link, snippet: '' });
      }
    }
  } catch (error) {
    console.error('Failed to search the web:', error);
  }

  updateStatus?.('[Info] Generating Response Based on Search Results');
  return postProcessResults(allResults);
};
