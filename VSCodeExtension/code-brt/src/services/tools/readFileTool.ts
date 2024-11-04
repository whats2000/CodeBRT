import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

export const readFileTool: ToolServicesApi['readFile'] = async ({
  relativeFilePath,
  updateStatus,
}) => {
  updateStatus?.('[processing] Reading file...');
  const result = await FileOperationsProvider.readFile(relativeFilePath);
  updateStatus?.('');

  if (result.status === 'error') {
    return { status: 'error', result: result.message };
  }

  return {
    status: 'success',
    result:
      `File content from "${relativeFilePath}" are show below, ` +
      `please check it out and continue with the next step:\n\n${result.message}`,
  };
};
