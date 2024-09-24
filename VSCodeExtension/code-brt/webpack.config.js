/* eslint-env node */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, { mode }) => {
  const isDev = mode === 'development';

  return {
    target: 'node',
    mode: mode || 'none',
    entry: {
      extension: './src/extension.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      chunkFormat: 'commonjs',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '[resource-path]',
    },
    externalsType: 'node-commonjs',
    externals: {
      vs: 'vs',
      vscode: 'commonjs vscode',
      'tree-sitter': 'commonjs tree-sitter',
      'tree-sitter-c-sharp': 'commonjs tree-sitter-c-sharp',
      'tree-sitter-c': 'commonjs tree-sitter-c',
      'tree-sitter-cpp': 'commonjs tree-sitter-cpp',
      'tree-sitter-javascript': 'commonjs tree-sitter-javascript',
      'tree-sitter-python': 'commonjs tree-sitter-python',
      'tree-sitter-typescript': 'commonjs tree-sitter-typescript',
      'tree-sitter-ruby': 'commonjs tree-sitter-ruby',
      bindings: 'commonjs bindings',
      'node-gyp-build': 'commonjs node-gyp-build',
      'detect-libc': 'commonjs detect-libc',
    },
    resolve: {
      roots: [__dirname],
      extensions: ['.js', '.ts'],
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
          // Handle native modules
          test: /\.node$/,
          use: 'node-loader',
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
        ].filter(Boolean),
      }),
    ].filter(Boolean),
    devtool: isDev ? 'inline-cheap-module-source-map' : false,
    infrastructureLogging: {
      level: isDev ? 'log' : 'warn',
    },
  };
};
