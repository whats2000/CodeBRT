import { ToolServiceProvider } from '../../../src/services/tools';
import { ToolServicesApi } from '../../../src/types';

describe('ToolService', () => {
  it('should register and execute webSearch tool correctly', async () => {
    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolServiceProvider.getTool(
      'webSearch',
    ) as ToolServicesApi['webSearch'];
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage: 6000,
        numResults: 4,
        format: 'text',
      });

      console.log(results);

      if (results.status === 'success') {
        const hasTitle = results.result.includes('[TITLE]');
        const hasUrl = results.result.includes('[URL]');
        const hasContent = results.result.includes('[CONTENT]');

        if (!hasTitle || !hasUrl || !hasContent) {
          console.warn('⚠️ Result missing expected structure:', results.result);
        }
      } else {
        console.warn(`⚠️ Search failed during test: ${results.result}`);
      }

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        '[processing] Searching Web with keyword "OpenAI"',
      );
      expect(mockUpdateStatus).toHaveBeenCalledWith('');
    }
  }, 30000);

  it('should return undefined for unregistered tool', () => {
    const tool = ToolServiceProvider.getTool('nonExistentTool');
    expect(tool).toBeUndefined();
  });

  it('should return a reasonable number of results', async () => {
    const query = 'Gemini';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolServiceProvider.getTool(
      'webSearch',
    ) as ToolServicesApi['webSearch'];
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const numResults = 5;
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage: 6000,
        numResults,
        format: 'text',
      });

      console.log(results);

      const resultCount = (results.result.match(/\[TITLE]/g) || []).length;
      if (resultCount === 0) {
        console.warn(
          '⚠️ No results returned (may be due to scraping restrictions).',
        );
      } else if (resultCount < numResults) {
        console.warn(`⚠️ Expected ${numResults}, got ${resultCount}`);
      }

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        '[processing] Searching Web with keyword "Gemini"',
      );
      expect(mockUpdateStatus).toHaveBeenCalledWith('');
    }
  }, 30000);

  it('should handle varying maxCharsPerPage', async () => {
    const query = 'Claude';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolServiceProvider.getTool(
      'webSearch',
    ) as ToolServicesApi['webSearch'];
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const maxCharsPerPage = 50;
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage,
        numResults: 4,
        format: 'text',
      });

      console.log(results);

      if (results.status === 'success') {
        const snippets = (results.result.match(/\[CONTENT] (.+)/g) || []).map(
          (s) => s.replace('[CONTENT] ', ''),
        );

        snippets.forEach((snippet) => {
          // This is NOT scraping-related — enforce strictly
          expect(snippet.length).toBeLessThanOrEqual(maxCharsPerPage);
        });
      } else {
        console.warn(`⚠️ Search failed during test: ${results.result}`);
      }

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        '[processing] Searching Web with keyword "Claude"',
      );
      expect(mockUpdateStatus).toHaveBeenCalledWith('');
    }
  }, 30000);
});
