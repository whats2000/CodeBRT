/**
 * The follow code is modified from the original source code.
 * https://github.com/continuedev/continue/blob/main/core/autocomplete/templates.ts
 * Under the Apache-2.0 License.
 */
export const SYSTEM_PROMPT = `You are a HOLE FILLER. Replace holes marked '{{HOLE_NAME}}' with precise, context-aware code inside <COMPLETION/> tags. 
Do NOT include any explanations, markdown formatting, or extra content.`;

export const CHAIN_OF_THOUGHT = `You follow these steps:
1. Analyze the context around {{FILL_HERE}}.
2. Decide if it's a comment or code that needs completion.
   - If a comment is incomplete, finish the comment.
   - If the comment is complete, generate the code based on it.
3. If it’s code, complete it accurately.
4. Ensure the style and format match the surrounding code.
5. Output only the correct completion in <COMPLETION> tags. No explanations, markdown, or extra content.`;

export const FEW_SHOT_EXAMPLES = `## EXAMPLE 1:

<LANGUAGE>C++</LANGUAGE>
<QUERY>
int sum_numbers(int n) {
  int sum = 0;
  for (int i = 0; i < n; i++) {
    {{FILL_HERE}}
  }
  return sum;
}
</QUERY>

## CORRECT COMPLETION:

<COMPLETION>if (i % 2 == 0) {
      sum += i;
    }</COMPLETION>

## EXAMPLE 2:

<LANGUAGE>Python</LANGUAGE>
<QUERY>
def sum_list(lst: List[int]) -> int:
  total = 0
  for x in lst:
  {{FILL_HERE}}
  return total
</QUERY>

## CORRECT COMPLETION:

<COMPLETION>  total += x</COMPLETION>

## EXAMPLE 3:

<LANGUAGE>TypeScript</LANGUAGE>
<QUERY>
// sum :: Tree Int -> Int
// sum (Node lft rgt) = sum lft + sum rgt
// sum (Leaf val)     = val
// Convert to TypeScript:
{{FILL_HERE}}
</QUERY>

## CORRECT COMPLETION:

<COMPLETION>type Tree<T>
  = {$:"Node", lft: Tree<T>, rgt: Tree<T>}
  | {$:"Leaf", val: T};

function sum(tree: Tree<number>): number {
  switch (tree.$) {
    case "Node":
      return sum(tree.lft) + sum(tree.rgt);
    case "Leaf":
      return tree.val;
    default:
      throw new Error("Invalid tree");
  }
}</COMPLETION>

## EXAMPLE 4:

<LANGUAGE>Python</LANGUAGE>
<QUERY>
def remove_spaces(s: str) -> str:
  """
  {{FILL_HERE}}
  """
  return s.replace(" ", "")
</QUERY>

## CORRECT COMPLETION:

<COMPLETION>Returns the input string with all spaces removed.</COMPLETION>

## EXAMPLE 5:

<LANGUAGE>JavaScript</LANGUAGE>
<QUERY>
function hypothenuse(a, b) {
  return Math.sqrt({{FILL_HERE}}b ** 2);
}
</QUERY>

## CORRECT COMPLETION:

<COMPLETION>a ** 2 + </COMPLETION>
`;

export const MAIN_PROMPT_TEMPLATE = `<LANGUAGE>{codeLanguage}</LANGUAGE>
<QUERY>
{prefix}{{FILL_HERE}}{suffix}
</QUERY>

TASK: Fill the {{FILL_HERE}} hole. Answer only with the CORRECT completion inside the <COMPLETION> tag. Do NOT include any explanations, markdown formatting, or extra content. Do it now.
<COMPLETION>`;
