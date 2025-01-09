/* eslint-env node */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, { mode }) => {
  const isDev = mode === 'development';
  const treeWasmDir = path.join('node_modules', 'web-tree-sitter');
  const languageWasmDir = path.join(
    __dirname,
    'node_modules',
    'tree-sitter-wasms',
    'out',
  );
  const treeWasmTargetDir = path.join('');
  const wasmTargetDir = path.join('trees');

  // List of languages to support
  const languages = [
    'c',
    'cpp',
    'c_sharp',
    'go',
    'java',
    'javascript',
    'kotlin',
    'php',
    'python',
    'ruby',
    'rust',
    'swift',
    'tsx',
    'typescript',
    'vue',
  ];

  return {
    target: 'node',
    mode: mode || 'none',
    entry: {
      extension: './src/extension.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFormat: 'commonjs',
      libraryTarget: 'commonjs',
      devtoolModuleFilenameTemplate: '[resource-path]',
    },
    externalsType: 'node-commonjs',
    externals: {
      vs: 'vs',
      vscode: 'commonjs vscode',
      electron: 'commonjs electron',
      'playwright-core': 'commonjs playwright-core',
      playwright: 'commonjs playwright',
    },
    resolve: {
      roots: [__dirname],
      extensions: ['.js', '.ts'],
      fallback: {
        electron: false,
        fs: false,
        net: false,
        tls: false,
      },
      alias: {
        playwright: path.resolve(__dirname, 'node_modules/playwright'),
        'playwright-core': path.resolve(
          __dirname,
          'node_modules/playwright-core',
        ),
      },
    },
    optimization: {
      minimize: !isDev,
    },
    module: {
      rules: [
        {
          test: /\.(ts?)?$/iu,
          use: {
            loader: 'swc-loader',
          },
          exclude: /node_modules/u,
        },
        {
          test: /\.css$/,
          use: ['css-loader'],
        },
        {
          test: /playwright-core/,
          use: 'null-loader',
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'static', to: 'static' },
          {
            from: 'package.json',
            to: 'package.json',
          },
          {
            from: 'package.nls.json',
            to: 'package.nls.json',
          },
          {
            from: 'package.nls.zh-cn.json',
            to: 'package.nls.zh-cn.json',
          },
          {
            from: 'package.nls.zh-tw.json',
            to: 'package.nls.zh-tw.json',
          },
          {
            from: path.join(treeWasmDir, 'tree-sitter.wasm'),
            to: path.join(treeWasmTargetDir, 'tree-sitter.wasm'),
          },
          ...languages.map((lang) => ({
            from: path.join(languageWasmDir, `tree-sitter-${lang}.wasm`),
            to: path.join(wasmTargetDir, `tree-sitter-${lang}.wasm`),
          })),
          {
            from: 'node_modules/playwright-core',
            to: 'node_modules/playwright-core',
          },
        ].filter(Boolean),
      }),
      new webpack.DefinePlugin({
        'process.env.PLAYWRIGHT_BROWSERS_PATH': JSON.stringify('0'),
      }),
    ].filter(Boolean),
    devtool: isDev ? 'inline-cheap-module-source-map' : false,
    infrastructureLogging: {
      level: isDev ? 'log' : 'warn',
    },
  };
};
