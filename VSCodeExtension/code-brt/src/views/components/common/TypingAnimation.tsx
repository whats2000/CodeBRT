import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { RendererCode } from './RenderCode';

type TypingAnimationProps = {
  message: string;
  isProcessing: boolean;
};

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  message,
  isProcessing,
}) => {
  const [displayedMessage, setDisplayedMessage] = useState(message);

  useEffect(() => {
    const length = displayedMessage.length;

    if (length < message.length) {
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

  return (
    <ReactMarkdown components={RendererCode}>{displayedMessage}</ReactMarkdown>
  );
};
