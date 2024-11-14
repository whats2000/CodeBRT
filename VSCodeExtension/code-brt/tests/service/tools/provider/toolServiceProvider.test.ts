import { ToolServiceProvider } from '../../../../src/services/tools';
import { ToolCallEntry } from '../../../../src/types';

// Mock external tools (like webSearch and urlFetcherTool)
jest.mock('../../../../src/services/tools/webSearchTool', () => ({
  webSearchTool: jest.fn().mockResolvedValue('Search results'),
}));

jest.mock('../../../../src/services/tools/urlFetcherTool', () => ({
  urlFetcherTool: jest.fn().mockResolvedValue('Fetched URL content'),
}));

describe('ToolServiceProvider Full Class Test', () => {
  let toolCallEntry: ToolCallEntry;

  beforeEach(() => {
    toolCallEntry = {
      id: '1',
      toolName: 'webSearch',
      parameters: { query: 'Test search query' },
      create_time: Date.now(),
    };
  });

  it('should return valid for a correct tool call with valid parameters', () => {
    const result = ToolServiceProvider.isViableToolCall(toolCallEntry);

    expect(result.isValid).toBe(true);
    expect(result.feedback).toBe('');
  });

  it('should return invalid if the tool does not exist', () => {
    toolCallEntry.toolName = 'nonExistingTool';

    const result = ToolServiceProvider.isViableToolCall(toolCallEntry);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toBe(
      'The tool "nonExistingTool" does not exist. Check the tool name and try again.',
    );
  });

  it('should return invalid if the parameter types are incorrect', () => {
    // Set the wrong type for the 'query' parameter in the entry
    toolCallEntry.parameters = { query: 12345 };

    const result = ToolServiceProvider.isViableToolCall(toolCallEntry);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toBe(
      'The parameter "query" of the tool "webSearch" is invalid. Please provide the correct parameter type and try again.',
    );
  });

  it('should return invalid if required parameters are missing', () => {
    // Modify the schema for webSearch to require 'numResults'
    const schema = ToolServiceProvider.getToolSchema();
    schema.webSearch.inputSchema.required = ['query', 'numResults'];

    const result = ToolServiceProvider.isViableToolCall(toolCallEntry);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toBe(
      'The tool "webSearch" requires the parameter "numResults". Please provide the parameter and try again.',
    );
  });
});
