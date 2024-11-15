import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    globby: '<rootDir>/mocks/globby.ts',
    'node-mic': '<rootDir>/mocks/node-mic.ts',
    'pdfjs-dist': '<rootDir>/mocks/pdfjs-dist.ts',
    vscode: '<rootDir>/mocks/vscode.ts',
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
};

export default jestConfig;
