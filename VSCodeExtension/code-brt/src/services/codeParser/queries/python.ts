/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/tree/main/src/services/tree-sitter/queries
 */
/*
- class definitions
- function definitions
*/
export default `
(class_definition
  name: (identifier) @name.definition.class) @definition.class

(function_definition
  name: (identifier) @name.definition.function) @definition.function
`;
