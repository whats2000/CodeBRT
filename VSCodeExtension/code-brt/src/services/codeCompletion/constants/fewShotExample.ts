import { CodeLanguageId } from '../types';

export const FEW_SHOT_EXAMPLES: {
  [key in CodeLanguageId]?: {
    query: string;
    completion: string;
  }[];
} = {
  javascript: [
    {
      query: `
function sum_evens(lim) {
  let sum = 0;
  for (let i = 0; i < lim; ++i) {
    {{FILL_HERE}}
  }
  return sum;
}`,
      completion: `
    if (i % 2 === 0) {
      sum += i;
    }`,
    },
  ],
  typescript: [
    {
      query: `
function sum_evens(lim: number): number {
  let sum = 0;
  for (let i = 0; i < lim; ++i) {
    {{FILL_HERE}}
  }
  return sum;
}`,
      completion: `
    if (i % 2 === 0) {
      sum += i;
    }`,
    },
  ],
  python: [
    {
      query: `
def sum_evens(lim):
  sum = 0
  for i in range(lim):
    {{FILL_HERE}}
  return sum`,
      completion: `
    if i % 2 == 0:
      sum += i`,
    },
  ],
  java: [
    {
      query: `
public class Main {
    public static int sumEvens(int lim) {
        int sum = 0;
        for (int i = 0; i < lim; i++) {
            {{FILL_HERE}}
        }
        return sum;
    }
}`,
      completion: `
            if (i % 2 == 0) {
                sum += i;
            }`,
    },
  ],
  cpp: [
    {
      query: `
int sum_evens(int lim) {
    int sum = 0;
    for (int i = 0; i < lim; ++i) {
        {{FILL_HERE}}
    }
    return sum;
}`,
      completion: `
        if (i % 2 == 0) {
            sum += i;
        }`,
    },
  ],
  csharp: [
    {
      query: `
public class Program {
    public static int SumEvens(int lim) {
        int sum = 0;
        for (int i = 0; i < lim; i++) {
            {{FILL_HERE}}
        }
        return sum;
    }
}`,
      completion: `
            if (i % 2 == 0) {
                sum += i;
            }`,
    },
  ],
  php: [
    {
      query: `
function sum_evens($lim) {
    $sum = 0;
    for ($i = 0; $i < $lim; $i++) {
        {{FILL_HERE}}
    }
    return $sum;
}`,
      completion: `
        if ($i % 2 == 0) {
            $sum += $i;
        }`,
    },
  ],
  ruby: [
    {
      query: `
def sum_evens(lim)
  sum = 0
  for i in 0...lim
    {{FILL_HERE}}
  end
  sum
end`,
      completion: `
    if i % 2 == 0
      sum += i
    end`,
    },
  ],
  clojure: [
    {
      query: `
(defn sum-evens [lim]
  (loop [i 0, sum 0]
    (if (< i lim)
      (recur (inc i) {{FILL_HERE}})
      sum)))`,
      completion: `
      (if (even? i)
        (+ sum i)
        sum)`,
    },
  ],
  r: [
    {
      query: `
sum_evens <- function(lim) {
  sum = 0
  for (i in 1:lim) {
    {{FILL_HERE}}
  }
  return(sum)
}`,
      completion: `
    if (i %% 2 == 0) {
      sum = sum + i
    }`,
    },
  ],
  yaml: [
    {
      query: `
items:
  - name: Item1
  - name: Item2
  {{FILL_HERE}}`,
      completion: `
  - name: Item3`,
    },
  ],
  markdown: [
    {
      query: `
# To Do List

- [ ] Task 1
- [ ] Task 2
{{FILL_HERE}}`,
      completion: `
- [ ] Task 3`,
    },
  ],
};
