import { postProcessCompletion } from '../../../../src/services/codeCompletion/utils';

describe('postProcessCompletion', () => {
  // Mock data for testing
  const modelName = 'testModel';

  test('should return null for empty completion', () => {
    const result = postProcessCompletion('', 'prefix', 'suffix', modelName);
    expect(result).toBeNull();
  });

  test('should return null for completion that rewrites the line above', () => {
    const completion = 'This is a repeated line.';
    const prefix = 'This is a repeated line.\n';

    const result = postProcessCompletion(
      completion,
      prefix,
      'suffix',
      modelName,
    );
    expect(result).toBeNull();
  });

  test('should filter out extreme repetition in completion', () => {
    const completion = `
      Repeated line.
      Repeated line.
      Repeated line.
      Repeated line.
      Repeated line.
      Repeated line.
    `;

    const prefix = 'Some prefix text.\n';
    const result = postProcessCompletion(
      completion,
      prefix,
      'suffix',
      modelName,
    );
    expect(result).toBeNull();
  });

  test('should trim trailing whitespace from completion', () => {
    const completion = 'Some valid completion with trailing spaces.   ';
    const prefix = 'Some prefix text.\n';

    const result = postProcessCompletion(
      completion,
      prefix,
      'suffix',
      modelName,
    );
    expect(result).toBe('Some valid completion with trailing spaces.');
  });

  test('should handle model-specific cases for "codestral"', () => {
    const completion = ' Some codestral completion.';
    const prefix = 'Some prefix text with a trailing space ';
    const suffix = '\n';

    const result = postProcessCompletion(
      completion,
      prefix,
      suffix,
      'codestral',
    );
    expect(result).toBe('Some codestral completion.');
  });

  test('should handle model-specific cases for "qwen"', () => {
    const completion = ' Qwen completion with leading space.';
    const prefix = 'Some prefix text.\n';
    const suffix = '';

    const result = postProcessCompletion(completion, prefix, suffix, 'qwen');
    expect(result).toBe('Qwen completion with leading space.');
  });

  test('should return completion with trimmed end spaces if no rules match', () => {
    const completion = 'Valid completion.  ';
    const prefix = 'Some prefix text.\n';

    const result = postProcessCompletion(
      completion,
      prefix,
      'suffix',
      modelName,
    );
    expect(result).toBe('Valid completion.');
  });

  test('should remove duplicated prefix from the beginning of the completion', () => {
    const completion =
      '  const someVariable = someValue;\n  const someOtherVariable = someOtherValue;';
    const prefix = '  const someVariable = someValue;\n';

    const result = postProcessCompletion(completion, prefix, '', modelName);
    expect(result).toBe('const someOtherVariable = someOtherValue;');
  });

  test('should remove duplicated prefix from the beginning of the completion (2)', () => {
    const completion =
      '  const someVariable = someValue;\n  const someOtherVariable = someOtherValue;';
    const prefix = '  const someVariable = someValue;\n';

    const result = postProcessCompletion(completion, prefix, '', modelName);
    expect(result).toBe('  const someOtherVariable = someOtherValue;');
  });
});
