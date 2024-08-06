import * as cheerio from 'cheerio';

export const extractTextFromWebpage = (htmlContent: string): string => {
  const $ = cheerio.load(htmlContent);
  $(
    'script, style, header, footer, nav, form, svg, img, image, button',
  ).remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
};
