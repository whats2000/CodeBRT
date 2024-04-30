import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/light";
import { dark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import React from "react";

export const renderers: { [nodeType: string]: React.ElementType } = {
  code: ({node, inline, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter style={dark} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')} {/* Removes newline from the end of the code block */}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};
