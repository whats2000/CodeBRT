export default `
; Class definitions
(
  (class_declaration
    name: (simple_identifier) @name
    body: (class_body)) @definition.class
)

; Interface definitions
(
  (interface_declaration
    name: (simple_identifier) @name
    body: (class_body)) @definition.interface
)

; Function definitions, including top-level and member functions
(
  (function_declaration
    name: (simple_identifier) @name) @definition.function
  (function_body) @definition.body
)

; Property definitions (e.g., variables or constants)
(
  (property_declaration
    name: (simple_identifier) @name
    type: (type)?) @definition.property
)

; Constructor captures for primary constructors with named parameters
(
  (primary_constructor
    (value_parameter_list
      (value_parameter
        name: (simple_identifier) @name))) @definition.parameter
)

; Method captures for member functions within a class
(
  (function_declaration
    name: (simple_identifier) @name
    (parameter_list) @definition.method.parameters
    (function_body) @definition.method.body) @definition.method
)

; Companion object captures for singleton-like static members
(
  (companion_object
    name: (simple_identifier) @name?) @definition.singleton
)

; Object declarations for singleton pattern usage
(
  (object_declaration
    name: (simple_identifier) @name) @definition.object
)

; Imports (not a definition but useful for context)
(
  (import_directive
    (identifier) @reference.import) @definition.import
)
`;
