import * as vscode from 'vscode';

import { detectCodeOmission } from '../../../../src/services/tools/utils';

// Mock vscode window to prevent actual UI interactions during tests
jest.mock('vscode', () => ({
  window: {
    showWarningMessage: jest.fn(),
  },
}));

describe('detectCodeOmission', () => {
  // Reset mocks before each test
  beforeEach(() => {
    (vscode.window.showWarningMessage as jest.Mock).mockClear();
  });

  test('should return false for normal code without omission patterns', () => {
    const originalContent = `
function example() {
  const x = 10;
  return x * 2;
}
`;
    const newContent = `
function example() {
  const x = 10;
  return x * 2;
}
`;

    const result = detectCodeOmission(originalContent, newContent);
    expect(result).toBeFalsy();
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  test('should detect omission pattern in comment', () => {
    const originalContent = `
function example() {
  // Some implementation
  const x = 10;
  return x * 2;
}
`;
    const newContent = `
function example() {
  // ... (rest omitted)
  const x = 10;
  return x * 2;
}
`;

    const result = detectCodeOmission(originalContent, newContent);
    expect(result).toBeTruthy();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('... (rest omitted)'),
    );
  });

  test('should detect various omission patterns', () => {
    const omissionPatterns = [
      '... (remaining code unchanged)',
      'rest remains unchanged',
      'remaining code is the same',
      'previous code unchanged',
      'existing code unchanged',
      '...',
      'unchanged',
      'remain',
    ];

    omissionPatterns.forEach((pattern) => {
      const originalContent = `
function example() {
  const x = 10;
  return x * 2;
}
`;
      const newContent = `
function example() {
  // ${pattern}
  const x = 10;
  return x * 2;
}
`;

      const result = detectCodeOmission(originalContent, newContent);
      expect(result).toBeTruthy();
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining(pattern),
      );
    });
  });

  test('should not trigger for non-comment lines with omission-like text', () => {
    const originalContent = `
function example() {
  const message = 'This is not an omission...';
  return message;
}
`;
    const newContent = `
function example() {
  const message = 'This is not an omission...';
  return message;
}
`;

    const result = detectCodeOmission(originalContent, newContent);
    expect(result).toBeFalsy();
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  test('should handle comments in different languages', () => {
    const commentStyles = [
      '// Single-line comment',
      '# Python/Shell style comment',
      '/* Block comment */',
      '{/* JSX comment */}',
      '<!-- HTML comment -->',
    ];

    commentStyles.forEach((commentStyle) => {
      const originalContent = `
function example() {
  const x = 10;
  return x * 2;
}
`;
      const newContent = `
function example() {
  ${commentStyle} ... (rest omitted)
  const x = 10;
  return x * 2;
}
`;

      const result = detectCodeOmission(originalContent, newContent);
      expect(result).toBeTruthy();
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('... (rest omitted)'),
      );
    });
  });

  test('should be case-insensitive for omission patterns', () => {
    const originalContent = `
function example() {
  const x = 10;
  return x * 2;
}
`;
    const newContent = `
function example() {
  // ... (REMAINING code UNCHANGED)
  const x = 10;
  return x * 2;
}
`;

    const result = detectCodeOmission(originalContent, newContent);
    expect(result).toBeTruthy();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('... (REMAINING code UNCHANGED)'),
    );
  });
});
