import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import { RendererCode, RendererCodeProvider } from './RenderCode';

type TypingAnimationProps = {
  message: string;
  isProcessing: boolean;
  scrollToBottom: (smooth: boolean) => void;
  hljsTheme: keyof typeof hljs;
  setHljsTheme: (theme: keyof typeof hljs) => void;
};

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  message,
  isProcessing,
  scrollToBottom,
  hljsTheme,
  setHljsTheme,
}) => {
  const [displayedMessage, setDisplayedMessage] = useState(message);

  useEffect(() => {
    const length = displayedMessage.length;

    if (length < message.length) {
      // Accelerate the typing speed when not loading (i.e., all data is received)
      const baseDelay = isProcessing ? 100 : 30;
      const remainingLength = message.length - length;
      const delay = Math.max(20, baseDelay - remainingLength);

      const timer = setTimeout(() => {
        // Calculate chunk size based on loading state
        const chunkSize = isProcessing
          ? Math.ceil(remainingLength / 10)
          : Math.ceil(remainingLength / 5);
        const nextLength = length + chunkSize;
        setDisplayedMessage(message.substring(0, nextLength));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [displayedMessage, message, isProcessing]);

  useEffect(() => {
    if (displayedMessage.length === message.length) {
      scrollToBottom(false);
    }
  }, [displayedMessage, message, scrollToBottom]);

  return (
    <RendererCodeProvider value={{ hljsTheme, setHljsTheme }}>
      <ReactMarkdown components={RendererCode}>
        {displayedMessage}
      </ReactMarkdown>
    </RendererCodeProvider>
  );
};
