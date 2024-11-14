import path from 'path';
import {
  cppQuery,
  cQuery,
  csharpQuery,
  goQuery,
  javaQuery,
  javascriptQuery,
  kotlinQuery,
  phpQuery,
  pythonQuery,
  rubyQuery,
  rustQuery,
  swiftQuery,
  typescriptQuery,
  typescriptReactQuery,
  vueQuery,
} from './queries';

export const getLanguageConfig = (extension: string) => {
  const wasmPath = path.resolve(__dirname, 'trees');

  const languageMappings: Record<
    string,
    {
      grammarPath: string;
      queryPattern: string;
    }
  > = {
    c: {
      grammarPath: path.join(wasmPath, 'tree-sitter-c.wasm'),
      queryPattern: cQuery,
    }, // C
    cpp: {
      grammarPath: path.join(wasmPath, 'tree-sitter-cpp.wasm'),
      queryPattern: cppQuery,
    }, // C++
    cs: {
      grammarPath: path.join(wasmPath, 'tree-sitter-c_sharp.wasm'),
      queryPattern: csharpQuery,
    }, // C#
    go: {
      grammarPath: path.join(wasmPath, 'tree-sitter-go.wasm'),
      queryPattern: goQuery,
    }, // Go
    java: {
      grammarPath: path.join(wasmPath, 'tree-sitter-java.wasm'),
      queryPattern: javaQuery,
    }, // Java
    js: {
      grammarPath: path.join(wasmPath, 'tree-sitter-javascript.wasm'),
      queryPattern: javascriptQuery,
    }, // JavaScript
    kt: {
      grammarPath: path.join(wasmPath, 'tree-sitter-kotlin.wasm'),
      queryPattern: kotlinQuery,
    }, // Kotlin
    php: {
      grammarPath: path.join(wasmPath, 'tree-sitter-php.wasm'),
      queryPattern: phpQuery,
    }, // PHP
    py: {
      grammarPath: path.join(wasmPath, 'tree-sitter-python.wasm'),
      queryPattern: pythonQuery,
    }, // Python
    rb: {
      grammarPath: path.join(wasmPath, 'tree-sitter-ruby.wasm'),
      queryPattern: rubyQuery,
    }, // Ruby
    rs: {
      grammarPath: path.join(wasmPath, 'tree-sitter-rust.wasm'),
      queryPattern: rustQuery,
    }, // Rust
    swift: {
      grammarPath: path.join(wasmPath, 'tree-sitter-swift.wasm'),
      queryPattern: swiftQuery,
    }, // Swift
    tsx: {
      grammarPath: path.join(wasmPath, 'tree-sitter-tsx.wasm'),
      queryPattern: typescriptReactQuery,
    }, // TypeScript with JSX (TSX)
    ts: {
      grammarPath: path.join(wasmPath, 'tree-sitter-typescript.wasm'),
      queryPattern: typescriptQuery,
    }, // TypeScript
    vue: {
      grammarPath: path.join(wasmPath, 'tree-sitter-vue.wasm'),
      queryPattern: vueQuery,
    }, // Vue.js
  };

  return languageMappings[extension] || null;
};
