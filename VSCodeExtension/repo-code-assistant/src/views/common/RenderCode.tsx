import React, { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import styled from "styled-components";

import { CopyIcon, CopySuccessIcon } from "../../icons";

const CodeBlockContainer = styled.div`
  position: relative;
`;

const CodeBlock = styled(SyntaxHighlighter)`
  background-color: #3C3C3C !important;
  border-radius: 4px;
  margin: 0; // Removes default margins
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  color: white;
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #3C3C3C;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: #3C3C3C;
    background-color: #ffffff90;
  }
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
        <CopyButton onClick={handleCopy} $copied={copied}>
          {copied ? <CopySuccessIcon /> : <CopyIcon />}
        </CopyButton>
      </CodeBlockContainer>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};
