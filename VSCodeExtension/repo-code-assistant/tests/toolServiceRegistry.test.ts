import { ToolServiceRegistry } from '../src/services/tools/toolServiceRegistry';
import { webSearchToolService } from '../src/services/tools/webSearchTool';

describe('ToolServiceRegistry', () => {
  it('should register and execute webSearch tool correctly', async () => {
    const registry = new ToolServiceRegistry();
    registry.register(webSearchToolService);

    const query = 'OpenAI';
    const mockUpdateStatus = jest.fn();

    const webSearch = registry.getTool('webSearch');
    expect(webSearch).toBeDefined();

    if (webSearch) {
      const results = await webSearch(query, mockUpdateStatus);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('snippet');

      // Print results to console
      console.log(results);

      // Verify updateStatus was called
      expect(mockUpdateStatus).toHaveBeenCalledWith('Searching Web');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Extracting Relevant Info');
    }
  });

  it('should return undefined for unregistered tool', () => {
    const registry = new ToolServiceRegistry();
    // @ts-ignore
    const tool = registry.getTool('nonExistentTool');
    expect(tool).toBeUndefined();
  });
});
