import * as cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';

export const convertHtmlToMarkdown = (htmlContent: string): string => {
  const $ = cheerio.load(htmlContent);

  // Remove unwanted tags
  $(
    'script, style, header, footer, nav, form, svg, img, image, button',
  ).remove();

  // Get cleaned HTML
  const cleanedHtml = $('body').html() || '';

  // Convert to Markdown
  return NodeHtmlMarkdown.translate(cleanedHtml);
};
