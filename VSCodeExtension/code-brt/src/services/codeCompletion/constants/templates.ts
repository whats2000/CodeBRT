// From https://github.com/VictorTaelin/AI-scripts
export const SYSTEM_PROMPT = `
You are a HOLE FILLER. You are provided with a file containing holes, formatted as '{{HOLE_NAME}}'. Your TASK is to complete with a string to replace this hole with, inside a <COMPLETION/> XML tag, including context-aware indentation, if needed.  All completions MUST be truthful, accurate, well-written and correct.
`;

export const MAIN_PROMPT_TEMPLATE = `
<QUERY>
{prefix}{{FILL_HERE}}{suffix}
</QUERY>
TASK: Fill the {{FILL_HERE}} hole. Answer only with the CORRECT completion, and NOTHING ELSE. Do it now.
<COMPLETION>
`;

export const BUILD_IN_FUNCTIONS_PROMPT_TEMPLATE = `
## Built-in Functions: {builtInFunctions}`;

export const COMMON_LIBRARIES_PROMPT_TEMPLATE = `
## Common Libraries: {commonLibraries}`;

export const TRIGGER_KIND_PROMPT_TEMPLATE = `
## Triggered by: {triggerCharacter}`;
