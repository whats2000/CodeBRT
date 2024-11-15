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

      // Print results to console
      console.log(results);

      expect(results.result).toContain('[TITLE]');
      expect(results.result).toContain('[URL]');
      expect(results.result).toContain('[CONTENT]');

      // Verify updateStatus was called
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

  it('should return the correct number of results', async () => {
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

      // Print results to console
      console.log(results);

      const resultCount = (results.result.match(/\[TITLE]/g) || []).length;
      expect(resultCount).toBe(numResults);

      // Verify updateStatus was called
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

      // Print results to console
      console.log(results);

      const snippets = results.result
        .split('**Snippet**: ')
        .slice(1)
        .map((snippet) => snippet.split('\n')[0]);
      snippets.forEach((snippet) => {
        if (snippet.length > maxCharsPerPage) {
          console.log(snippet);
        }

        expect(snippet.length).toBeLessThanOrEqual(maxCharsPerPage);
      });

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        '[processing] Searching Web with keyword "Claude"',
      );
      expect(mockUpdateStatus).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalledWith('');
    }
  }, 30000);
});
