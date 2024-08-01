import { ToolService } from '../src/services/tools';

describe('ToolService', () => {
  it('should register and execute webSearch tool correctly', async () => {
    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolService.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage: 6000,
        numResults: 4,
      });

      // Print results to console
      console.log(results);

      expect(results).toContain('Title:');
      expect(results).toContain('URL:');
      expect(results).toContain('Snippet:');

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  }, 30000);

  it('should return undefined for unregistered tool', () => {
    const tool = ToolService.getTool('nonExistentTool');
    expect(tool).toBeUndefined();
  });

  it('should return the correct number of results', async () => {
    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolService.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const numResults = 5;
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage: 6000,
        numResults,
      });

      // Print results to console
      console.log(results);

      const resultCount = (results.match(/Title:/g) || []).length;
      expect(resultCount).toBe(numResults);

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  }, 30000);

  it('should handle varying maxCharsPerPage', async () => {
    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = ToolService.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const maxCharsPerPage = 50;
      const results = await webSearch({
        query,
        updateStatus: mockUpdateStatus,
        maxCharsPerPage,
        numResults: 4,
      });

      // Print results to console
      console.log(results);

      const snippets = results
        .split('Snippet: ')
        .slice(1)
        .map((snippet) => snippet.split('\n')[0]);
      snippets.forEach((snippet) => {
        if (snippet.length > maxCharsPerPage) {
          console.log(snippet);
        }

        expect(snippet.length).toBeLessThanOrEqual(maxCharsPerPage);
      });

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  }, 30000);
});
