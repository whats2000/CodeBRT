import type { ToolFunction, ToolService, ToolServiceType } from '../../types';

export class ToolServiceRegistry {
  private toolServices: { [key in ToolServiceType]?: ToolFunction } = {};

  register(toolService: ToolService): void {
    this.toolServices[toolService.name] = toolService.execute;
  }

  getTool(name: ToolServiceType): ToolFunction | undefined {
    return this.toolServices[name];
  }
}
