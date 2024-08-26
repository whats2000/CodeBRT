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
  const indentedLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 && (line.startsWith('  ') || line.startsWith('\t'))
    );
  });

  if (indentedLines.length > lines.length / 3) {
    return [indentedLines.join('\n')];
  } else {
    return [
      lines
        .filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed.length > 0 &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('#') &&
            !trimmed.startsWith('*') &&
            !/^\d+\./.test(trimmed)
          );
        })
        .join('\n'),
    ];
  }
}
