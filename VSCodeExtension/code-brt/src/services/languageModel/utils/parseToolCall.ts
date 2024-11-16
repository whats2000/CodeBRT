type ToolCall = {
  function: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
};

// This pattern is common seen in the qwen model
const POSSIBLE_TOOL_CALLS_XML = [
  'call',
  'xml',
  'tool_call',
  'tool-call',
  'tools',
  'tool',
  'response',
  'json',
  'function',
  'functionCall',
  'functionCalls',
  'function_call',
  'function-call',
  'function_calls',
  'function-calls',
];

// Some models use code blocks to represent tool calls
const POSSIBLE_TOOL_CALLS_BLOCKS = ['```json', '```xml'];

// This use for the mistral model
const POSSIBLE_TOOL_CALLS_MARKERS = ['[TOOL_CALLS]'];

// If all else fails, try to parse the content as a JSON object to test if it is a tool call.
// This common in the llama model
const POSSIBLE_TOOL_CALLS_REGEX = /({\s*"name"\s*:\s*".*?"\s*,.*})/;

export type ExtractedToolCall = {
  text: string;
  toolCall?: ToolCall;
};

export class ParseToolCallUtils {
  private static tryExtractToolCall = (
    result: ExtractedToolCall,
    potentialJson: string,
    textBeforeToolCall: string,
  ): ExtractedToolCall | undefined => {
    // Try to parse and validate the content
    try {
      let parsed = JSON.parse(potentialJson);

      if (Array.isArray(parsed)) {
        parsed = parsed[0];
      }

      if (parsed && parsed.name && (parsed.parameters || parsed.arguments)) {
        result.text = textBeforeToolCall;
        result.toolCall = {
          function: {
            name: parsed.name,
            arguments: parsed.parameters || parsed.arguments,
          },
        };
        return result;
      }
    } catch (error) {
      return undefined;
    }
  };

  public static extractToolCalls = (content: string): ExtractedToolCall => {
    let jsonContent = content;
    let textBeforeToolCall = jsonContent;

    // Define the result structure with the default text (full content if no tool call is found)
    const result: ExtractedToolCall = {
      text: content,
      toolCall: undefined,
    };

    // Check for content inside XML-like tags
    for (const tag of POSSIBLE_TOOL_CALLS_XML) {
      const startTag = `<${tag}>`;
      const endTag = `</${tag}>`;

      let startIndex = jsonContent.indexOf(startTag);
      let endIndex = jsonContent.indexOf(endTag);

      while (startIndex !== -1 && endIndex !== -1) {
        // Extract the text before the tool call
        textBeforeToolCall = jsonContent.substring(0, startIndex).trim();

        // Extract the content between the tags
        const potentialJson = jsonContent
          .substring(startIndex + startTag.length, endIndex)
          .trim();

        // Try to parse and validate the content
        const parseResult = ParseToolCallUtils.tryExtractToolCall(
          result,
          potentialJson,
          textBeforeToolCall,
        );

        if (parseResult) {
          return parseResult;
        }

        // Move to the next set of tags in case of failure to parse
        startIndex = jsonContent.indexOf(startTag, endIndex + endTag.length);
        endIndex = jsonContent.indexOf(endTag, startIndex + startTag.length);
      }
    }

    // Check for content inside code block markers
    for (const block of POSSIBLE_TOOL_CALLS_BLOCKS) {
      const startBlock = block;
      const endBlock = '```'; // All blocks are typically closed by ```

      let startIndex = jsonContent.indexOf(startBlock);
      let endIndex = jsonContent.indexOf(
        endBlock,
        startIndex + startBlock.length,
      );

      while (startIndex !== -1 && endIndex !== -1) {
        // Extract the text before the tool call
        textBeforeToolCall = jsonContent.substring(0, startIndex).trim();

        // Extract the content between the markers
        const potentialJson = jsonContent
          .substring(startIndex + startBlock.length, endIndex)
          .trim();

        // Try to parse and validate the content
        const parseResult = ParseToolCallUtils.tryExtractToolCall(
          result,
          potentialJson,
          textBeforeToolCall,
        );

        if (parseResult) {
          return parseResult;
        }

        // Move to the next set of markers in case of failure to parse
        startIndex = jsonContent.indexOf(
          startBlock,
          endIndex + endBlock.length,
        );
        endIndex = jsonContent.indexOf(
          endBlock,
          startIndex + startBlock.length,
        );
      }
    }

    // Check for the [TOOL_CALLS] marker
    for (const marker of POSSIBLE_TOOL_CALLS_MARKERS) {
      let startIndex = jsonContent.indexOf(marker);

      if (startIndex !== -1) {
        // Extract the text before the tool call
        textBeforeToolCall = jsonContent.substring(0, startIndex).trim();

        // Extract the content after the marker
        const potentialJson = jsonContent
          .substring(startIndex + marker.length)
          .trim();

        // Try to parse and validate the content
        const parseResult = ParseToolCallUtils.tryExtractToolCall(
          result,
          potentialJson,
          textBeforeToolCall,
        );

        if (parseResult) {
          return parseResult;
        }
      }
    }

    // For llamas, check for the tool call in the content as it will not have any tags or blocks
    const match = jsonContent.match(POSSIBLE_TOOL_CALLS_REGEX);
    if (match) {
      const potentialJson = match[1]; // First captured group, which is the JSON object
      textBeforeToolCall = jsonContent.substring(0, match.index).trim();

      // Try to parse and validate the content
      const parseResult = ParseToolCallUtils.tryExtractToolCall(
        result,
        potentialJson,
        textBeforeToolCall,
      );

      if (parseResult) {
        return parseResult;
      }
    }

    // Return the result containing text and tool call (if found)
    return result;
  };
}
