/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/clinebot/cline/blob/main/src/core/prompts/system.ts
 */
import { ToolSchema } from '../types';

export const webSearchSchema: ToolSchema = {
  name: 'webSearch',
  description: `Use this tool to fetch the latest information from the web, especially for time-sensitive or recent data.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The query to search for. Ensure the query is specific and well-defined to get precise results.',
      },
      maxCharsPerPage: {
        type: 'number',
        description:
          'The maximum number of characters to extract from each webpage. Default is 6000. Adjust if a different limit is required.',
      },
      numResults: {
        type: 'number',
        description:
          'The number of results to return. Default is 4. Modify if more or fewer results are needed.',
      },
    },
    required: ['query'],
  },
};

export const urlFetcherSchema: ToolSchema = {
  name: 'urlFetcher',
  description:
    `Use this tool to fetch and extract content from a specific URL. ` +
    `This is particularly useful for retrieving information from known sources.`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description:
          'The URL of the webpage to fetch and extract content from. Ensure the URL is valid.',
      },
      maxCharsPerPage: {
        type: 'number',
        description:
          'The maximum number of characters to extract from the webpage. ' +
          'Default is 6000. Adjust if a different limit is required.',
      },
    },
    required: ['url'],
  },
};

export const executeCommandSchema = (
  currentWorkspacePath: string,
): ToolSchema => ({
  name: 'executeCommand',
  description:
    `Execute a CLI command on the system. ` +
    `Use this when you need to perform system operations or run specific commands to accomplish any step in the user's task. ` +
    `You must tailor your command to the user's system and provide a clear explanation of what the command does. ` +
    `Prefer to execute complex CLI commands over creating executable scripts, as they are more flexible and easier to run. ` +
    `Commands will be executed in the current working directory: ${currentWorkspacePath}`,
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description:
          'The CLI command to execute. This should be valid for the current operating system. ' +
          'Ensure the command is properly formatted and does not contain any harmful instructions.',
      },
    },
    required: ['command'],
  },
});

export const readFileSchema = (currentWorkspacePath: string): ToolSchema => ({
  name: 'readFile',
  description:
    'Read the contents of a file at the specified path. ' +
    'Use this when you need to examine the contents of an existing file, for example to analyze code, review text files, or extract information from configuration files. ' +
    'Automatically extracts raw text from PDF and DOCX files. May not be suitable for other types of binary files, as it returns the raw content as a string.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: `The path of the file to read (relative to the current working directory ${currentWorkspacePath})`,
      },
    },
    required: ['filePath'],
  },
});

export const writeToFileSchema = (
  currentWorkspacePath: string,
): ToolSchema => ({
  name: 'writeToFile',
  description:
    'Write content to a file at the specified path. If the file exists, it will be overwritten with the provided content. ' +
    "If the file doesn't exist, it will be created. " +
    'Always provide the full intended content of the file, without any truncation. ' +
    'This tool will automatically create any directories needed to write the file.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: `The path of the file to write to (relative to the current working directory ${currentWorkspacePath})`,
      },
      content: {
        type: 'string',
        description: 'The full content to write to the file.',
      },
    },
    required: ['path', 'content'],
  },
});

export const searchFilesSchema = (
  currentWorkspacePath: string,
): ToolSchema => ({
  name: 'searchFiles',
  description:
    'Perform a regex search across files in a specified directory, providing context-rich results. ' +
    'This tool searches for patterns or specific content across multiple files, displaying each match with encapsulating context.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          `The path of the directory to search in (relative to the current working directory ${currentWorkspacePath}). ` +
          `This directory will be recursively searched.`,
      },
      regex: {
        type: 'string',
        description:
          'The regular expression pattern to search for. Uses Rust regex syntax.',
      },
      filePattern: {
        type: 'string',
        description:
          "Optional glob pattern to filter files (e.g., '*.ts' for TypeScript files). " +
          'If not provided, it will search all files (*).',
      },
    },
    required: ['path', 'regex'],
  },
});

export const listFilesSchema = (currentWorkspacePath: string): ToolSchema => ({
  name: 'listFiles',
  description:
    'List files and directories within the specified directory. ' +
    'If recursive is true, it will list all files and directories recursively. ' +
    'If recursive is false or not provided, it will only list the top-level contents.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: `The path of the directory to list contents for (relative to the current working directory ${currentWorkspacePath}).`,
      },
      recursive: {
        type: 'boolean',
        description:
          "Whether to list files recursively. Use 'true' for recursive listing, 'false' or omit for top-level only.",
      },
    },
    required: ['path'],
  },
});

export const listCodeDefinitionNamesSchema = (
  currentWorkspacePath: string,
): ToolSchema => ({
  name: 'listCodeDefinitionNames',
  description:
    'Lists definition names (classes, functions, methods, etc.) used in source code files at the top level of the specified directory. ' +
    'This tool provides insights into the codebase structure and important constructs, ' +
    'encapsulating high-level concepts and relationships that are crucial for understanding the overall architecture.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: `The path of the directory (relative to the current working directory ${currentWorkspacePath}) to list top level source code definitions for`,
      },
    },
    required: ['path'],
  },
});

export const inspectSiteSchema: ToolSchema = {
  name: 'inspectSite',
  description:
    'Captures a screenshot and console logs of the initial state of a website. ' +
    'This tool navigates to the specified URL, takes a screenshot of the entire page as it appears immediately after loading, ' +
    'and collects any console logs or errors that occur during page load. ' +
    'It does not interact with the page or capture any state changes after the initial load.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description:
          'The URL of the site to inspect. ' +
          'This should be a valid URL including the protocol (e.g. http://localhost:3000/page, file:///path/to/file.html, etc.)',
      },
    },
    required: ['url'],
  },
};

export const askFollowUpQuestionSchema: ToolSchema = {
  name: 'askFollowUpQuestion',
  description:
    'Ask the user a question to gather additional information needed to complete the task. ' +
    'This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. ' +
    'It allows for interactive problem-solving by enabling direct communication with the user. ' +
    'Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth.',
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'The question to ask the user. This should be a clear, specific question that addresses the information you need.',
      },
    },
    required: ['question'],
  },
};

export const attemptCompletionSchema: ToolSchema = {
  name: 'attemptCompletion',
  description:
    "Once you've completed the task, use this tool to present the result to the user. " +
    "Optionally you may provide a CLI command to showcase the result of your work, but avoid using commands like 'echo' or 'cat' that merely print text. " +
    'They may respond with feedback if they are not satisfied with the result, which you can use to make improvements and try again.',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description:
          'A CLI command to execute to show a live demo of the result to the user. ' +
          "For example, use 'open index.html' to display a created website. " +
          'This command should be valid for the current operating system. ' +
          'Ensure the command is properly formatted and does not contain any harmful instructions.',
      },
      result: {
        type: 'string',
        description:
          'The result of the task. ' +
          'Formulate this result in a way that is final and does not require further input from the user. ' +
          "Don't end your result with questions or offers for further assistance.",
      },
    },
    required: ['result'],
  },
};
