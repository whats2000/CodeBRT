import { ToolServicesApi } from './types';

export const listCodeDefinitionNamesTool: ToolServicesApi['listCodeDefinitionNames'] =
  async ({ relativePath, updateStatus }) => {
    // TODO: Implement listCodeDefinitionNames tool with the tree-sitter parser.
    updateStatus?.('');
    return {
      status: 'error',
      result:
        'This feature is not implemented yet. Try `listFiles` tool with the "' +
        relativePath +
        '" directory. Then, use `readFile` tool with the file path to get the content.',
    };
  };
