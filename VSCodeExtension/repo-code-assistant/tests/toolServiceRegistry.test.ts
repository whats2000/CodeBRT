import { ToolServiceRegistry } from '../src/services/tools/toolServiceRegistry';
import { webSearchToolService } from '../src/services/tools/webSearchTool';

const showResults = (results: any) => {
  // Print results to console
  console.log(results);

  expect(results).toBeInstanceOf(Array);
  expect(results.length).toBeGreaterThan(0); // Ensure that we have results
  expect(results[0]).toHaveProperty('title');
  expect(results[0]).toHaveProperty('url');
  expect(results[0]).toHaveProperty('snippet');
};

describe('ToolServiceRegistry', () => {
  it('should register and execute webSearch tool correctly', async () => {
    const registry = new ToolServiceRegistry();
    registry.register(webSearchToolService);

    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = registry.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const results = await webSearch(query, mockUpdateStatus, 6000, 4);

      // Print results to console
      showResults(results);

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  });

  it('should return undefined for unregistered tool', () => {
    const registry = new ToolServiceRegistry();
    // @ts-expect-error
    const tool = registry.getTool('nonExistentTool');
    expect(tool).toBeUndefined();
  });

  it('should return the correct number of results', async () => {
    const registry = new ToolServiceRegistry();
    registry.register(webSearchToolService);

    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = registry.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const numResults = 5;
      const results = await webSearch(
        query,
        mockUpdateStatus,
        6000,
        numResults,
      );

      // Print results to console
      console.log(results);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(numResults); // Ensure that we have the correct number of results
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('snippet');

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  });

  it('should handle varying maxCharsPerPage', async () => {
    const registry = new ToolServiceRegistry();
    registry.register(webSearchToolService);

    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = registry.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const maxCharsPerPage = 1000;
      const results = await webSearch(
        query,
        mockUpdateStatus,
        maxCharsPerPage,
        4,
      );

      // Print results to console
      showResults(results);

      expect(results[0].snippet.length).toBeLessThanOrEqual(maxCharsPerPage);

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  });
});
