import axios from 'axios';
import { extractTextFromWebpage } from '../../../src/services/tools/utils';
import { urlFetcherTool } from '../../../src/services/tools/urlFetcherTool';

jest.mock('axios');
jest.mock('../../../src/utils');

describe('urlFetcherTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and process content from URL correctly', async () => {
    const url = 'https://example.com';
    const mockUpdateStatus = jest.fn();
    const mockResponseData =
      '<html lang="en"><body>Example Content</body></html>';
    const mockVisibleText = 'Example Content';

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: mockResponseData }),
    });

    (extractTextFromWebpage as jest.Mock).mockReturnValue(mockVisibleText);

    const result = await urlFetcherTool({
      url,
      updateStatus: mockUpdateStatus,
      maxCharsPerPage: 6000,
      format: 'text',
    });

    // Print results to console
    console.log(result);

    expect(result).toContain('Extracted Content from URL:');
    expect(result).toContain(mockVisibleText);

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      `[Fetching] Fetching content from URL "${url}"`,
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      '[Info] Generating Response Based on Extracted Content',
    );
  }, 30000);

  it('should handle maxCharsPerPage correctly', async () => {
    const url = 'https://example.com';
    const mockUpdateStatus = jest.fn();
    const mockResponseData =
      '<html lang="en"><body>' + 'A'.repeat(7000) + '</body></html>';
    const mockVisibleText = 'A'.repeat(7000);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: mockResponseData }),
    });

    (extractTextFromWebpage as jest.Mock).mockReturnValue(mockVisibleText);

    const maxCharsPerPage = 6000;
    const result = await urlFetcherTool({
      url,
      updateStatus: mockUpdateStatus,
      maxCharsPerPage,
      format: 'text',
    });

    const extractedContent = result.split('Extracted Content from URL:\n\n')[1];
    expect(extractedContent.length).toBeLessThanOrEqual(maxCharsPerPage);

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      `[Fetching] Fetching content from URL "${url}"`,
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      '[Info] Generating Response Based on Extracted Content',
    );
  }, 30000);

  it('should return error message on fetch failure', async () => {
    const url = 'https://example.com';
    const mockUpdateStatus = jest.fn();

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('Fetch failed')),
    });

    const result = await urlFetcherTool({
      url,
      updateStatus: mockUpdateStatus,
      maxCharsPerPage: 6000,
      format: 'text',
    });

    // Print results to console
    console.log(result);

    expect(result).toBe('Failed to fetch the URL content.');

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      `[Fetching] Fetching content from URL "${url}"`,
    );
  }, 30000);
});
