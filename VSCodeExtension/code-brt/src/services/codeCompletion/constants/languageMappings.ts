import { CodeLanguageId, ChatModelCompleteLanguageInfo } from '../types';
import {
  C,
  Clojure,
  Cpp,
  CSharp,
  Go,
  Java,
  Kotlin,
  Markdown,
  PHP,
  Python,
  R,
  Ruby,
  Rust,
  Swift,
  Typescript,
  Vue,
  YAML,
} from './languageInfo';

export const FILE_TO_LANGUAGE_CONTEXT: {
  [key in CodeLanguageId]?: ChatModelCompleteLanguageInfo;
} = {
  typescript: Typescript,
  javascript: Typescript,
  typescriptreact: Typescript,
  javascriptreact: Typescript,
  jupyter: Python,
  python: Python,
  java: Java,
  c: C,
  cpp: Cpp,
  csharp: CSharp,
  php: PHP,
  ruby: Ruby,
  clojure: Clojure,
  r: R,
  rust: Rust,
  yaml: YAML,
  markdown: Markdown,
  go: Go,
  kotlin: Kotlin,
  swift: Swift,
  vue: Vue,
};

export const FILE_PATTERN_MAPPING: { [key in CodeLanguageId]: string[] } = {
  abap: ['abap'],
  bat: ['bat', 'cmd'],
  bibtex: ['bib'],
  clojure: ['clj', 'cljs', 'cljc'],
  coffeescript: ['coffee'],
  c: ['c', 'h'],
  cpp: ['cpp', 'cc', 'cxx', 'hpp', 'hxx', 'hh'],
  csharp: ['cs'],
  dockercompose: ['yaml', 'yml'],
  css: ['css'],
  'cuda-cpp': ['cu', 'cuh'],
  d: ['d'],
  pascal: ['pas', 'pp'],
  diff: ['diff', 'patch'],
  dockerfile: ['Dockerfile'],
  erlang: ['erl', 'hrl'],
  fsharp: ['fs', 'fsi', 'fsx', 'fsscript'],
  'git-commit': ['git/COMMIT_EDITMSG'],
  'git-rebase': ['git/REBASE_HEAD'],
  go: ['go'],
  groovy: ['groovy', 'gvy', 'gy', 'gsh'],
  handlebars: ['hbs', 'handlebars'],
  haml: ['haml'],
  haskell: ['hs'],
  html: ['html', 'htm'],
  ini: ['ini', 'cfg', 'prefs', 'pro'],
  java: ['java'],
  javascript: ['js', 'mjs'],
  javascriptreact: ['jsx'],
  json: ['json'],
  jsonc: ['jsonc'],
  julia: ['jl'],
  jupyter: ['ipynb'],
  kotlin: ['kt', 'kts'],
  latex: ['tex'],
  less: ['less'],
  lua: ['lua'],
  makefile: ['Makefile'],
  markdown: ['md', 'markdown'],
  'objective-c': ['m', 'h'],
  'objective-cpp': ['mm', 'h'],
  ocaml: ['ml', 'mli'],
  perl: ['pl', 'pm', 't'],
  php: ['php', 'phtml'],
  plaintext: ['txt'],
  powershell: ['ps1', 'psm1', 'psd1'],
  jade: ['jade', 'pug'],
  python: ['py', 'pyw'],
  r: ['r', 'rmd'],
  rails: ['rb'],
  razor: ['cshtml'],
  ruby: ['rb', 'erb', 'rake'],
  rust: ['rs'],
  sass: ['sass'],
  scss: ['scss'],
  shaderlab: ['shader'],
  shellscript: ['sh', 'bash', 'zsh', 'fish'],
  slim: ['slim'],
  sql: ['sql'],
  stylus: ['styl'],
  svelte: ['svelte'],
  swift: ['swift'],
  typescript: ['ts'],
  typescriptreact: ['tsx'],
  tex: ['tex'],
  vb: ['vb'],
  vue: ['vue'],
  'vue-html': ['html'],
  xml: ['xml', 'xsd', 'xsl', 'xslt'],
  xsl: ['xsl', 'xslt'],
  yaml: ['yaml', 'yml'],
};

export const FILE_TO_LANGUAGE: { [key: string]: CodeLanguageId } =
  Object.entries(FILE_PATTERN_MAPPING).reduce(
    (acc, [language, extensions]) => {
      extensions.forEach((ext) => {
        acc[ext] = language as CodeLanguageId;
      });
      return acc;
    },
    {} as { [key: string]: CodeLanguageId },
  );

export const LANGUAGE_NAME_MAPPING: { [key in CodeLanguageId]: string } = {
  abap: 'ABAP',
  bat: 'Batch',
  bibtex: 'BibTeX',
  clojure: 'Clojure',
  coffeescript: 'CoffeeScript',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  dockercompose: 'Docker Compose',
  css: 'CSS',
  'cuda-cpp': 'CUDA C++',
  d: 'D',
  pascal: 'Pascal',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  erlang: 'Erlang',
  fsharp: 'F#',
  'git-commit': 'Git Commit',
  'git-rebase': 'Git Rebase',
  go: 'Go',
  groovy: 'Groovy',
  handlebars: 'Handlebars',
  haml: 'HAML',
  haskell: 'Haskell',
  html: 'HTML',
  ini: 'INI',
  java: 'Java',
  javascript: 'JavaScript',
  javascriptreact: 'JavaScript React',
  json: 'JSON',
  jsonc: 'JSON with Comments',
  julia: 'Julia',
  jupyter: 'Jupyter Notebook',
  kotlin: 'Kotlin',
  latex: 'LaTeX',
  less: 'LESS',
  lua: 'Lua',
  makefile: 'Makefile',
  markdown: 'Markdown',
  'objective-c': 'Objective-C',
  'objective-cpp': 'Objective-C++',
  ocaml: 'OCaml',
  perl: 'Perl',
  php: 'PHP',
  plaintext: 'Plain Text',
  powershell: 'PowerShell',
  jade: 'Jade',
  python: 'Python',
  r: 'R',
  rails: 'Ruby on Rails',
  razor: 'Razor',
  ruby: 'Ruby',
  rust: 'Rust',
  sass: 'Sass',
  scss: 'SCSS',
  shaderlab: 'ShaderLab',
  shellscript: 'Shell Script',
  slim: 'Slim',
  sql: 'SQL',
  stylus: 'Stylus',
  svelte: 'Svelte',
  swift: 'Swift',
  typescript: 'TypeScript',
  typescriptreact: 'TypeScript React',
  tex: 'TeX',
  vb: 'VB',
  vue: 'Vue',
  'vue-html': 'Vue HTML',
  xml: 'XML',
  xsl: 'XSL',
  yaml: 'YAML',
};
