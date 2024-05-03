import React, { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import styled from "styled-components";

import { CopyButton } from "./CopyButton";

const CodeBlockContainer = styled.div`
  position: relative;
`;

const CodeBlock = styled(SyntaxHighlighter)`
  background-color: #3C3C3C !important;
  border-radius: 4px;
  margin: 0;
`;

const OtherCodeBlock = styled.code`
  display: block;
  padding: 10px;
  overflow-x: scroll;
`;

export const RendererCode: { [nodeType: string]: React.ElementType } = {
  code: ({node, inline, className, children, ...props}) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        })
        .catch(err => console.error('Failed to copy text: ', err));
    };

    return !inline && match ? (
      <CodeBlockContainer>
        <CodeBlock style={darcula} language={match[1]} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
        <CopyButton copied={copied} handleCopy={handleCopy}/>
      </CodeBlockContainer>
    ) : children?.includes('\n') ? (
      <OtherCodeBlock className={className} {...props}>
        {children}
      </OtherCodeBlock>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};
