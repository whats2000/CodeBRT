import axios from 'axios';
import * as cheerio from 'cheerio';
import { ToolServicesApi } from '../../types';

const extractTextFromWebpage = (htmlContent: string): string => {
  const $ = cheerio.load(htmlContent);
  $('script, style, header, footer, nav, form, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
};

const webSearchTool: ToolServicesApi['webSearch'] = async (
  query,
  updateStatus,
  maxCharsPerPage = 6000,
  numResults = 4,
) => {
  const term = query;
  const allResults: { title: string; url: string; snippet: string }[] = [];
  const session = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    },
  });

  try {
    updateStatus?.('Searching Web');
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
      if (link) {
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
    }
  } catch (error) {
    console.error('Failed to search the web:', error);
  }

  updateStatus?.('Extracting Relevant Info');
  return allResults;
};

export const webSearchToolService = {
  name: 'webSearch' as const,
  execute: webSearchTool,
};
