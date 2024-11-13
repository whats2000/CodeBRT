export default `
; Vue Component Definitions
(
  (element
    (start_tag
      (tag_name) @definition.component)
    (element
      (start_tag
        (attribute
          name: (attribute_name) @name
          value: (quoted_attribute_value) @doc))
      (#match? @name "name")
      (#strip! @doc "^['\"]|['\"]$"))
  ) @definition.component
)

; Script section definitions
(
  (script_element
    (script_start_tag
      (attribute
        name: (attribute_name) @name
        value: (quoted_attribute_value) @doc))
    (#match? @name "lang")
    (#strip! @doc "^['\"]|['\"]$"))
  . 
  [
    (class_declaration
      name: (identifier) @name) @definition.class
    (function_declaration
      name: (identifier) @name) @definition.function
    (variable_declaration
      (variable_declarator
        name: (identifier) @name
        value: [(arrow_function) (function_expression)]) @definition.function)
  ]
)

; Template section for component structure (basic handling of tags)
(
  (element
    (start_tag
      (tag_name) @reference.component
      (attribute
        name: (attribute_name) @name
        value: (quoted_attribute_value) @doc)) @reference.component)
  (#match? @name "is|v-bind")
)

; Style section definitions
(
  (style_element
    (style_start_tag
      (attribute
        name: (attribute_name) @name
        value: (quoted_attribute_value) @doc))
    (#match? @name "lang"))
  . (style_block) @definition.style
)
`;
