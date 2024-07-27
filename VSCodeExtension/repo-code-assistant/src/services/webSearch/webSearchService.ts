import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebSearchService {
  private static extractTextFromWebpage(htmlContent: string): string {
    const $ = cheerio.load(htmlContent);
    $('script, style, header, footer, nav, form, svg').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  public static async search(
    query: string,
    updateStatus: (status: string) => void,
  ): Promise<{ link: string; text: string | null }[]> {
    const term = query;
    const maxCharsPerPage = 6000;
    const allResults: { link: string; text: string | null }[] = [];
    const session = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
      },
    });

    try {
      updateStatus('Searching Web');
      const resp = await session.get('https://www.google.com/search', {
        params: { q: term, num: 4, udm: 14 },
        timeout: 5000,
      });
      const $ = cheerio.load(resp.data);
      const resultBlocks = $('div.g');

      for (const result of resultBlocks.toArray()) {
        const linkElement = $(result).find('a[href]').first();
        const link = linkElement.attr('href');
        if (link) {
          try {
            const webpage = await session.get(link, { timeout: 5000 });
            const visibleText = this.extractTextFromWebpage(webpage.data);
            const truncatedText =
              visibleText.length > maxCharsPerPage
                ? visibleText.substring(0, maxCharsPerPage)
                : visibleText;
            allResults.push({ link, text: truncatedText });
          } catch (error) {
            allResults.push({ link, text: null });
          }
        }
      }
    } catch (error) {
      console.error('Failed to search the web:', error);
    }

    updateStatus('Extracting Relevant Info');
    return allResults;
  }
}
