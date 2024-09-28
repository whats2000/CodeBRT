export const SYSTEM_PROMPT = `You are a HOLE FILLER. You are provided with a file {languageName} containing holes, formatted as '{{HOLE_NAME}}'. Your TASK is to replace these holes with a string inside a <COMPLETION/> XML tag. The completion MUST:

- Be precise, context-aware, and well-written.
- Maintain proper indentation and formatting as required by the context.
- Ensure correctness and truthfulness in all completions.

Only return the completion, wrapped inside the <COMPLETION/> tag. Nothing else should be included in the output.`;

export const FEW_SHOT_EXAMPLES = `

## EXAMPLE QUERY:

<QUERY>
function sum_evens(lim) {
  var sum = 0;
  for (var i = 0; i < lim; ++i) {
    {{FILL_HERE}}
  }
  return sum;
}
</QUERY>

TASK: Fill the {{FILL_HERE}} hole.

## CORRECT COMPLETION:

<COMPLETION>if (i % 2 === 0) {
      sum += i;
    }</COMPLETION>

## EXAMPLE QUERY:

<QUERY>
def sum_list(lst):
  total = 0
  for x in lst:
  {{FILL_HERE}}
  return total

print sum_list([1, 2, 3])
</QUERY>

TASK: Fill the {{FILL_HERE}} hole.

## CORRECT COMPLETION:

<COMPLETION>  total += x</COMPLETION>

## EXAMPLE QUERY:

<QUERY>
// data Tree a = Node (Tree a) (Tree a) | Leaf a

// sum :: Tree Int -> Int
// sum (Node lft rgt) = sum lft + sum rgt
// sum (Leaf val)     = val

// convert to TypeScript:
{{FILL_HERE}}
</QUERY>

TASK: Fill the {{FILL_HERE}} hole.

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
  }
}</COMPLETION>

## EXAMPLE QUERY:

The 5th {{FILL_HERE}} is Jupiter.

TASK: Fill the {{FILL_HERE}} hole.

## CORRECT COMPLETION:

<COMPLETION>planet from the Sun</COMPLETION>

## EXAMPLE QUERY:

<QUERY>
function hypothenuse(a, b) {
  return Math.sqrt({{FILL_HERE}}b ** 2);
}
</QUERY>

TASK: Fill the {{FILL_HERE}} hole.

## CORRECT COMPLETION:

<COMPLETION>a ** 2 + </COMPLETION>
`;

export const MAIN_PROMPT_TEMPLATE = `

<QUERY>
{prefix}{{FILL_HERE}}{suffix}
</QUERY>

TASK: Fill the {{FILL_HERE}} hole. Answer only with the CORRECT completion inside the <COMPLETION> tag. Do NOT include any explanations, markdown formatting, or extra content.
`;
