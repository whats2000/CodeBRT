type ToolCall = {
  function: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
};

export class ParseToolCallUtils {
  static extractToolCalls = (content: string): ToolCall | undefined => {
    let jsonContent = content;

    // Remove <tool_call> tags if present
    if (content.includes('<tool_call>')) {
      jsonContent = content.replace(/<tool_call>|<\/tool_call>/g, '').trim();
    }

    try {
      // Parse the JSON string to an object
      const parsed = JSON.parse(jsonContent);

      // Ensure the parsed object has the required structure
      if (parsed && parsed.name && (parsed.parameters || parsed.arguments)) {
        return {
          function: {
            name: parsed.name,
            arguments: parsed.parameters || parsed.arguments,
          },
        };
      } else {
        return {
          function: {
            name: 'Unknown Tool Format',
            arguments: {},
          },
        };
      }
    } catch (error) {
      console.error('Failed to convert content to tool call:', error);
    }
  };

  static cleanResponseText = (text: string): string => {
    // Remove <tool_call> tagged content
    let cleanedText = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '\n');

    // Remove untagged tool call JSON objects
    const lines = cleanedText.split('\n');
    let inCodeBlock = false;
    let filteredLines: string[] = [];
    let skipNextLines = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        filteredLines.push(line);
        continue;
      }

      if (!inCodeBlock) {
        if (
          line.trim().startsWith('{') &&
          line.includes('"name":') &&
          line.includes('"arguments":')
        ) {
          skipNextLines = true;
          filteredLines.push('\n');
        } else if (skipNextLines && line.trim().endsWith('}')) {
          skipNextLines = false;
        } else if (!skipNextLines) {
          filteredLines.push(line);
        }
      } else {
        filteredLines.push(line);
      }
    }

    // Trim any leading/trailing whitespace and remove any consecutive newlines
    return filteredLines
      .join('\n')
      .trim()
      .replace(/\n\s*\n/g, '\n');
  };

  static isPotentialToolCallStart = (content: string): boolean => {
    return content.includes('<tool_call>') || content.trim().startsWith('{');
  };

  static isPotentialToolCallEnd = (content: string): boolean => {
    return (
      content.includes('</tool_call>') ||
      (content.includes('"name":') &&
        content.includes('"arguments":') &&
        content.trim().endsWith('}'))
    );
  };
}
