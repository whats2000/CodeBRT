export function extractCodeBetweenTags(response: string): string[] {
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
  const matches = [];
  let match;
  while ((match = codeBlockRegex.exec(response)) !== null) {
    if (match[1].trim().length > 0) {
      matches.push(match[1].trim());
    }
  }
  return matches;
}

export function filterByIndentation(response: string): string[] {
  const lines = response.split('\n');
  let inMultiLineComment = false;
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();

    if (
      trimmed.startsWith('/*') ||
      trimmed.startsWith('"""') ||
      trimmed.startsWith("'''")
    ) {
      inMultiLineComment = true;
    }
    if (
      trimmed.endsWith('*/') ||
      trimmed.endsWith('"""') ||
      trimmed.endsWith("'''")
    ) {
      inMultiLineComment = false;
      return false;
    }

    if (inMultiLineComment) {
      return false;
    }

    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('*') &&
      !/^\d+\./.test(trimmed)
    );
  });

  if (filteredLines.length > lines.length / 3) {
    return [filteredLines.join('\n')];
  } else {
    return [lines.filter((line) => line.trim().length > 0).join('\n')];
  }
}
