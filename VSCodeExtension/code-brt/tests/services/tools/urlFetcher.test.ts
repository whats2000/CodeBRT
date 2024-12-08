import axios from 'axios';
import { urlFetcherTool } from '../../../src/services/tools/urlFetcherTool';
import { convertHtmlToMarkdown } from '../../../src/services/tools/utils';

jest.mock('axios');
jest.mock('../../../src/services/tools/utils');

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

    (convertHtmlToMarkdown as jest.Mock).mockReturnValue(mockVisibleText);

    const result = await urlFetcherTool({
      url,
      updateStatus: mockUpdateStatus,
      maxCharsPerPage: 6000,
      format: 'text',
    });

    // Print results to console
    console.log(result);

    expect(result.result).toBe(
      'Content retrieved from the URL "https://example.com". Please use this information to answer the previously asked question:\n\nExample Content',
    );

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      `[processing] Fetching content from URL "${url}"`,
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith('');
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

    (convertHtmlToMarkdown as jest.Mock).mockReturnValue(mockVisibleText);

    const maxCharsPerPage = 6000;
    const { result } = await urlFetcherTool({
      url,
      updateStatus: mockUpdateStatus,
      maxCharsPerPage,
      format: 'text',
    });

    const countOfA = result.split('A').length - 1;

    expect(countOfA).toBeLessThanOrEqual(maxCharsPerPage);

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      `[processing] Fetching content from URL "${url}"`,
    );
    expect(mockUpdateStatus).toHaveBeenCalledWith('');
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

    expect(result.result).toBe('Failed to fetch the URL.');

    // Verify updateStatus was called
    expect(mockUpdateStatus).toHaveBeenCalledWith('');
  }, 30000);
});
