import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

export const writeToFileTool: ToolServicesApi['writeToFile'] = async ({
  relativePath,
  content,
  updateStatus,
}) => {
  updateStatus?.('[processing] Writing to file...');

  const { status, message } = await FileOperationsProvider.writeToFile(
    relativePath,
    content,
    true,
  );

  if (status === 'error') {
    return { status: 'error', result: message };
  }

  return { status: 'success', result: message };
};
