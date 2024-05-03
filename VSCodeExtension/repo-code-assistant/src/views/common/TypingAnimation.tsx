import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { RendererCode } from "./RenderCode";

export const TypingAnimation = (
  {
    message,
    isLoading,
    scrollToBottom,
  }: {
    message: string;
    isLoading: boolean;
    scrollToBottom: () => void;
  }) => {
  const [displayedMessage, setDisplayedMessage] = useState("");

  useEffect(() => {
    const length = displayedMessage.length;

    if (length < message.length) {
      // Accelerate the typing speed when not loading (i.e., all data is received)
      const baseDelay = isLoading ? 100 : 30;
      const remainingLength = message.length - length;
      const delay = Math.max(20, baseDelay - remainingLength);

      const timer = setTimeout(() => {
        // Calculate chunk size based on loading state
        const chunkSize = isLoading ? Math.ceil(remainingLength / 10) : Math.ceil(remainingLength / 5);
        const nextLength = length + chunkSize;
        setDisplayedMessage(message.substring(0, nextLength));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [displayedMessage, message, isLoading]);

  useEffect(() => {
    if (displayedMessage.length === message.length) {
      scrollToBottom();
    }
  }, [displayedMessage, message, scrollToBottom]);

  return <ReactMarkdown components={RendererCode}>{displayedMessage}</ReactMarkdown>;
};
