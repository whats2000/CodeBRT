// adaptiveOutputParser.ts

import { CompletionOptions } from '../index.js';
import { AutocompleteSnippet } from './ranking.js';
import { filterCodeSnippets } from './codeSnippetFilter.js';

interface AutocompleteTemplate {
  compilePrefixSuffix?: (
    prefix: string,
    suffix: string,
    filepath: string,
    reponame: string,
    snippets: AutocompleteSnippet[],
  ) => [string, string];
  template:
    | string
    | ((
        prefix: string,
        suffix: string,
        filepath: string,
        reponame: string,
        language: string,
        snippets: AutocompleteSnippet[],
      ) => string);
  completionOptions?: Partial<CompletionOptions>;
  parse: (rawOutput: string) => string;
}

export class AdaptiveOutputParser {
  private templates: Map<string, AutocompleteTemplate>;

  constructor() {
    this.templates = new Map();
    // 初始化模板，您可以從現有的 constants.ts 中導入這些模板
    this.templates.set('stablecode', {
      template: '<fim_prefix>{{{prefix}}}<fim_suffix>{{{suffix}}}<fim_middle>',
      completionOptions: {
        stop: [
          '<fim_prefix>',
          '<fim_suffix>',
          '<fim_middle>',
          '<|endoftext|>',
          '<file_sep>',
          '</fim_middle>',
          '</code>',
        ],
      },
      parse: (rawOutput: string) => {
        const match = rawOutput.match(/<fim_middle>([\s\S]*?)(<fim_suffix>|$)/);
        return match ? match[1].trim() : rawOutput.trim();
      },
    });
    // 添加其他模型的模板...
  }

  getTemplateForModel(model: string): AutocompleteTemplate {
    const lowerCaseModel = model.toLowerCase();
    let template = this.templates.get(lowerCaseModel);

    if (!template) {
      for (const [key, value] of this.templates.entries()) {
        if (lowerCaseModel.includes(key)) {
          template = value;
          break;
        }
      }
    }

    return template || this.templates.get('stablecode')!;
  }

  generatePrompt(
    model: string,
    prefix: string,
    suffix: string,
    filepath: string,
    reponame: string,
    language: string,
    snippets: AutocompleteSnippet[],
  ): string {
    const template = this.getTemplateForModel(model);
    if (typeof template.template === 'function') {
      return template.template(
        prefix,
        suffix,
        filepath,
        reponame,
        language,
        snippets,
      );
    }
    return template.template
      .replace('{{{prefix}}}', prefix)
      .replace('{{{suffix}}}', suffix);
  }

  parse(rawOutput: string, model: string): string {
    const template = this.getTemplateForModel(model);
    return template.parse(rawOutput);
  }

  getCompletionOptions(model: string): Partial<CompletionOptions> {
    const template = this.getTemplateForModel(model);
    return template.completionOptions || {};
  }

  addTemplate(modelType: string, template: AutocompleteTemplate) {
    this.templates.set(modelType.toLowerCase(), template);
  }
}
