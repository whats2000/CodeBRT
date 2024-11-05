import { ToolServicesApi } from './types';

export const executeCommandTool: ToolServicesApi['executeCommand'] = async ({
  command,
  updateStatus,
}) => {
  // TODO: Use terminal manager to execute command.
  updateStatus?.('');
  return {
    status: 'error',
    result:
      'This feature is not implemented yet, tell user manually execute command: ' +
      command,
  };
};
