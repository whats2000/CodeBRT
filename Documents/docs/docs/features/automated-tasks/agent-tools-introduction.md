# Agent Tools Introduction

## Overview
The agent tools provide a comprehensive set of functionalities to interact with files, execute commands, search content, and perform web-related tasks. These tools are designed to help accomplish various computational and information-gathering tasks efficiently.

## Available Tools

### 1. Web and URL Tools
#### webSearch
- **Purpose**: Fetch the latest information from the web
- **Key Parameters**:
    - `query`: Search query (required)
    - `maxCharsPerPage`: Limit characters per page (optional, default: 6000)
    - `numResults`: Number of search results (optional, default: 4)

#### urlFetcher
- **Purpose**: Extract content from a specific URL
- **Key Parameters**:
    - `url`: URL to fetch content from (required)
    - `maxCharsPerPage`: Limit characters extracted (optional, default: 6000)

### 2. File Management Tools
#### readFile
- **Purpose**: Read contents of a file
- **Key Parameters**:
    - `relativeFilePath`: Path to the file to read (required)
- **Special Features**:
    - Automatically extracts text from PDF and DOCX files
    - Returns raw content as a string

#### writeToFile
- **Purpose**: Write content to a file
- **Key Parameters**:
    - `relativePath`: Path where file will be written (required)
    - `content`: Full content to write (required)
- **Special Features**:
    - Creates directories if they don't exist
    - Overwrites existing files

#### searchFiles
- **Purpose**: Perform regex search across multiple files
- **Key Parameters**:
    - `relativePath`: Directory to search (required)
    - `regex`: Regular expression pattern (required)
    - `filePattern`: Optional file type filter (e.g., '*.ts')

#### listFiles
- **Purpose**: List files and directories in a specified path
- **Key Parameters**:
    - `relativePath`: Path to list contents (required)
    - `recursive`: Whether to list files recursively (optional)

### 3. Code and Development Tools
#### listCodeDefinitionNames
- **Purpose**: List top-level code definitions in a directory
- **Key Parameters**:
    - `relativePath`: Directory to analyze (required)
- **Insights**:
    - Reveals classes, functions, methods at the top level
    - Helps understand code structure and architecture

### 4. System and Command Tools
#### executeCommand
- **Purpose**: Run CLI commands on the system
- **Key Parameters**:
    - `command`: CLI command to execute (required)
    - `relativePath`: Optional directory to run the command
    - `timeoutDuration`: Command execution timeout (default: 10 seconds)

### 5. Web Interaction Tools
#### inspectSite
- **Purpose**: Capture initial state of a website
- **Key Parameters**:
    - `url`: Website URL to inspect (required)
- **Features**:
    - Takes full-page screenshot
    - Captures initial console logs
    - Does not interact with page after initial load

### 6. Interactive Tools
#### askFollowUpQuestion
- **Purpose**: Gather additional information from the user
- **Key Parameters**:
    - `question`: Specific question to ask (required)
- **Use Case**: Clarify ambiguities or request more details

#### attemptCompletion
- **Purpose**: Present task results
- **Key Parameters**:
    - `result`: Final task outcome (required)
    - `command`: Optional CLI command to demonstrate result

## Usage Guidelines
1. Choose the appropriate tool based on your specific task
2. Provide required parameters carefully
3. Use tools in a sequential, logical manner
4. Be mindful of file paths and system limitations

## Best Practices
- Use `relativePath` to maintain context
- Validate inputs before executing commands
- Handle potential errors gracefully
- Leverage combination of tools for complex tasks

## Limitations
- Some tools have character or result limits
- Network-dependent tools may have connectivity issues
- System-specific commands might not work across all environments

## Security Note
Always verify commands and URLs to prevent unintended actions or security risks.
