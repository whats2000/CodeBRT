import { ToolServiceRegistry } from './toolServiceRegistry';
import { webSearchToolService } from './webSearchTool';

const toolServiceRegistry = new ToolServiceRegistry();

toolServiceRegistry.register(webSearchToolService);

export { toolServiceRegistry };
