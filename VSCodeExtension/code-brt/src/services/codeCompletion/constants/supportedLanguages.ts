import { FILE_TO_LANGUAGE_CONTEXT } from './languageMappings';

export const SUPPORTED_LANGUAGES = Object.keys(FILE_TO_LANGUAGE_CONTEXT)
  .map((ext) => {
    switch (ext) {
      case 'ts':
      case 'js':
      case 'tsx':
      case 'jsx':
        return { scheme: 'file', language: 'typescript' };
      case 'py':
      case 'pyi':
        return { scheme: 'file', language: 'python' };
      case 'ipynb':
        return { scheme: 'file', language: 'jupyter' };
      case 'java':
        return { scheme: 'file', language: 'java' };
      case 'cpp':
      case 'cxx':
      case 'h':
      case 'hpp':
        return { scheme: 'file', language: 'cpp' };
      case 'cs':
        return { scheme: 'file', language: 'csharp' };
      case 'c':
        return { scheme: 'file', language: 'c' };
      case 'php':
        return { scheme: 'file', language: 'php' };
      case 'rb':
        return { scheme: 'file', language: 'ruby' };
      case 'clj':
      case 'cljs':
      case 'cljc':
        return { scheme: 'file', language: 'clojure' };
      case 'r':
      case 'R':
        return { scheme: 'file', language: 'r' };
      case 'yaml':
      case 'yml':
        return { scheme: 'file', language: 'yaml' };
      case 'md':
        return { scheme: 'file', language: 'markdown' };
      default:
        return null;
    }
  })
  .filter((lang) => lang !== null) as { scheme: string; language: string }[];
