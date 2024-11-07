import path from 'path';

export const getLanguageConfig = (extension: string) => {
  const wasmPath = path.resolve(__dirname, 'trees');

  const languageMappings: Record<string, { grammarPath: string }> = {
    c: { grammarPath: path.join(wasmPath, 'tree-sitter-c.wasm') }, // C
    cpp: { grammarPath: path.join(wasmPath, 'tree-sitter-cpp.wasm') }, // C++
    cs: { grammarPath: path.join(wasmPath, 'tree-sitter-c_sharp.wasm') }, // C#
    go: { grammarPath: path.join(wasmPath, 'tree-sitter-go.wasm') }, // Go
    java: { grammarPath: path.join(wasmPath, 'tree-sitter-java.wasm') }, // Java
    js: { grammarPath: path.join(wasmPath, 'tree-sitter-javascript.wasm') }, // JavaScript
    kt: { grammarPath: path.join(wasmPath, 'tree-sitter-kotlin.wasm') }, // Kotlin
    php: { grammarPath: path.join(wasmPath, 'tree-sitter-php.wasm') }, // PHP
    py: { grammarPath: path.join(wasmPath, 'tree-sitter-python.wasm') }, // Python
    rb: { grammarPath: path.join(wasmPath, 'tree-sitter-ruby.wasm') }, // Ruby
    rs: { grammarPath: path.join(wasmPath, 'tree-sitter-rust.wasm') }, // Rust
    swift: { grammarPath: path.join(wasmPath, 'tree-sitter-swift.wasm') }, // Swift
    tsx: { grammarPath: path.join(wasmPath, 'tree-sitter-tsx.wasm') }, // TypeScript with JSX (TSX)
    ts: { grammarPath: path.join(wasmPath, 'tree-sitter-typescript.wasm') }, // TypeScript
    vue: { grammarPath: path.join(wasmPath, 'tree-sitter-vue.wasm') }, // Vue.js
  };

  return languageMappings[extension] || null;
};
