import React from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type { ConversationEntry } from '../../../../types';
import { TypingAnimation } from '../../common/TypingAnimation';
import { RendererCode, RendererCodeProvider } from '../../common/RenderCode';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';

const MessageText = styled.span`
  word-wrap: break-word;
  margin: 10px 0;
`;

type MessageTextContainerProps = {
  entry: ConversationEntry;
  conversationHistoryCurrent: string;
  isProcessing: boolean;
  hljsTheme: keyof typeof hljs;
  setHljsTheme: (theme: keyof typeof hljs) => void;
  toolStatus: string;
};

export const TextContainer: React.FC<MessageTextContainerProps> = ({
  entry,
  conversationHistoryCurrent,
  isProcessing,
  hljsTheme,
  setHljsTheme,
  toolStatus,
}) => {
  return (
    <MessageText>
      {entry.role === 'AI' &&
      entry.id === conversationHistoryCurrent &&
      isProcessing ? (
        <>
          <TypingAnimation
            message={entry.message}
            isProcessing={isProcessing}
            hljsTheme={hljsTheme}
            setHljsTheme={setHljsTheme}
          />
          {toolStatus !== '' && <ToolStatusBlock status={toolStatus} />}
        </>
      ) : (
        <RendererCodeProvider
          value={{
            hljsTheme,
            setHljsTheme,
          }}
        >
          <ReactMarkdown components={RendererCode} children={entry.message} />
        </RendererCodeProvider>
      )}
    </MessageText>
  );
};
