export const MAIN_PROMPT_TEMPLATE = `Complete the following {languageName} code. 
The completion should fit between the prefix and suffix. 
Provide only the code that should be inserted, no explanations:

Prefix:
{prefix}

Suffix:
{suffix}

Completion:`;

export const BUILD_IN_FUNCTIONS_PROMPT_TEMPLATE = `

Available built-in functions: {builtInFunctions}`;

export const COMMON_LIBRARIES_PROMPT_TEMPLATE = `

Available common libraries: {commonLibraries}`;

export const TRIGGER_KIND_PROMPT_TEMPLATE = `

This completion was triggered by the character: {triggerCharacter}`;
