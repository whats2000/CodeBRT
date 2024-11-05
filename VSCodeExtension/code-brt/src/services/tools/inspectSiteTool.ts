import { ToolServicesApi } from './types';

export const inspectSiteTool: ToolServicesApi['inspectSite'] = async ({
  url,
  updateStatus,
}) => {
  // TODO: Implement inspectSite tool with the screenshot and console monitoring.
  updateStatus?.('');

  return {
    status: 'error',
    result:
      'This feature is not implemented yet, tell user manually inspect site: ' +
      url +
      ' in browser, and give feedback.',
  };
};
