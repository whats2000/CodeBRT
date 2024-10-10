import type { ToolFunction, ToolServicesApi, ToolServiceType } from './types';
import { webSearchTool } from './webSearchTool';
import { urlFetcherTool } from './urlFetcher';

export class ToolService {
  private static readonly toolServices: {
    [key in ToolServiceType]: ToolFunction;
  } = {
    webSearch: webSearchTool,
    urlFetcher: urlFetcherTool,
  };

  public static getTool(
    name: string,
  ): ToolServicesApi[keyof ToolServicesApi] | undefined {
    if (name in this.toolServices) {
      return this.toolServices[name as ToolServiceType];
    }

    return undefined;
  }
}
