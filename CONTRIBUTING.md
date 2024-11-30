# Contributing to CodeBRT

We welcome contributions to CodeBRT! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful, inclusive, and considerate of others. We aim to maintain a welcoming environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check existing issues to ensure the issue hasn't been reported before.
2. Use the issue templates provided:
   - For bug reports, include:
     - Detailed description
     - Steps to reproduce
     - Expected vs. actual behavior
     - Environment details
   - For feature requests, describe:
     - The proposed feature
     - Potential implementation approach
     - Potential benefits

### Pull Request Process

1. Fork the repository
2. Create a new branch for your feature or bugfix
   - Use a clear, descriptive branch name
   - Example: `feature/add-new-functionality` or `bugfix/resolve-specific-issue`
3. Make your changes
4. Ensure your code follows the project's coding standards
5. Write or update tests as needed
6. Ensure all tests pass
7. Submit a pull request with:
   - Clear title
   - Detailed description of changes
   - Reference to any related issues

## Project Setup

### VSCode Extension Development

1. Navigate to the VSCode Extension directory
   ```bash
   cd VSCodeExtension/code-brt
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Open the project in Visual Studio Code
4. To run and debug the extension:
   - Go to the "Run and Debug" view (Ctrl+Shift+D)
   - Select "Run Extension" configuration
   - Press F5 or click the green play button

### Documentation Development

1. Navigate to the Documents directory
   ```bash
   cd Documents
   ```
2. Install dependencies
   ```bash
   yarn
   ```
3. Start the development server
   ```bash
   yarn start
   ```

## Coding Guidelines

### TypeScript Coding Standards

1. **Code Formatting**
   - Use Prettier for consistent code formatting
   - Run `prettier --write` before committing changes

2. **Function Styles**
   - Prefer arrow functions throughout the project
   ```typescript
   // Preferred
   const myFunction = (param: string) => {
     // Function body
   };
   ```

3. **Project Structure**
   The project is organized into specific modules:

   - `src/api/`: Handles registration and interface between frontend and backend
     - `index.ts`: Export necessary classes and functions
     - Contains module-specific types, constants, and utilities

   - `src/integrations/`: Manages IDE control and interactions
     - `index.ts`: Export necessary classes and functions
     - Contains module-specific types, constants, and utilities

   - `src/services/`: Implements connectors and complex handling logic
     - `index.ts`: Export necessary classes and functions
     - Contains module-specific types, constants, and utilities

4. **Shared Resources**
   - Global types, constants, and utilities are located under `src/types/`, `src/constants/`, and `src/utils/`
   - Use these for resources that are used across multiple modules

5. **Testing**
   - Write test cases for your implementations
   - Tests are located in `tests/` under the `src` directory
   - Ensure good test coverage to aid in debugging and maintaining code quality

### Commit Message Guidelines

Commit messages should follow a specific format that clearly describes the type of change:

- `Add:` For adding a new function or feature
  ```
  Add: Add new XML parsing utility function
  ```

- `Feat:` For changing or enhancing existing functionality
  ```
  Feat: Improve error handling in API module
  ```

- `Fix:` For resolving bugs or issues
  ```
  Fix: Resolve memory leak in service connector
  ```

- `Update:` For updating source code, documentation, or dependencies
  ```
  Update: Refactor code structure for better readability
  ```

#### Commit Message Structure
1. Start with the type of change (`Add:`, `Feat:`, `Fix:`, `Update:`)
2. Provide a clear, concise description
3. Optionally add more detailed explanation in the commit body

### Reviewing Process

- All pull requests require review from project maintainers
- Be open to feedback and constructive criticism
- Maintainers may request changes or provide suggestions

## Questions?

If you have any questions about contributing, please open an issue or reach out to the project maintainers.

## License

By contributing, you agree that your contributions will be licensed under the project's existing license.

Thank you for your interest in contributing to CodeBRT! 🚀