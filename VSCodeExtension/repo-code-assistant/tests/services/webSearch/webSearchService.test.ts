import { WebSearchService } from '../../../src/services/webSearch/webSearchService';

describe('WebSearchService', () => {
  it('should return search results for a given query', async () => {
    const query = 'GPT-4o'; // Search query
    const updateStatus = (status: string) => {
      console.log('Status:', status); // Output status updates
    };

    const results = await WebSearchService.search(query, updateStatus);

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    results.forEach((result: any) => {
      expect(result.link).toBeDefined();
      expect(result.text).toBeDefined();
      console.log('Result:', result); // Output search results
    });
  });
});
