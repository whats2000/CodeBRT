import React from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type { ConversationEntry } from '../../../../types';
import { TypingAnimation } from '../../common/TypingAnimation';
import { RendererCode, RendererCodeProvider } from '../../common/RenderCode';

const MessageText = styled.span`
  word-wrap: break-word;
  margin: 10px 0;
`;

type MessageTextContainerProps = {
  entry: ConversationEntry;
  conversationHistoryCurrent: string;
  isProcessing: boolean;
  scrollToBottom: () => void;
  hljsTheme: keyof typeof hljs;
  setHljsTheme: (theme: keyof typeof hljs) => void;
};

export const TextContainer: React.FC<MessageTextContainerProps> = ({
  entry,
  conversationHistoryCurrent,
  isProcessing,
  scrollToBottom,
  hljsTheme,
  setHljsTheme,
}) => {
  return (
    <MessageText>
      {entry.role === 'AI' &&
      entry.id === conversationHistoryCurrent &&
      isProcessing ? (
        <TypingAnimation
          message={entry.message}
          isProcessing={isProcessing}
          scrollToBottom={scrollToBottom}
          hljsTheme={hljsTheme}
          setHljsTheme={setHljsTheme}
        />
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
