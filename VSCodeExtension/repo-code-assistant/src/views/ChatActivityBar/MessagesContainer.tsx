import React from "react";
import ReactMarkdown from "react-markdown";
import { RendererCode } from "../common/RenderCode";
import styled from "styled-components";

import { ConversationHistory } from "../../types/conversationHistory";
import TypingAnimation from "../common/TypingAnimation";

const StyledMessagesContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 35px;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
`;

const MessageBubble = styled.div<{ $user: string }>`
  display: flex;
  flex-direction: column;
  background-color: ${({$user}) => $user === "user" ? "#666" : "#333"};
  border-radius: 15px;
  padding: 8px 10px;
  margin: 10px;
  align-self: ${({$user}) => $user === "user" ? "flex-end" : "flex-start"};
  color: lightgrey;
`;

// Use RespondCharacter if needed, or modify as follows for better markdown display:
const MessageText = styled.span`
  word-wrap: break-word;
`;

const RespondCharacter = styled.span<{ $user: string }>`
  color: ${({$user}) => $user === "user" ? "#f0f0f0" : "#09f"};
  font-weight: bold;
  margin-bottom: 5px;
  display: inline-block;
`;

interface MessagesContainerProps {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messages: ConversationHistory;
  isLoading: boolean;
  scrollToBottom: () => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

export const MessagesContainer: React.FC<MessagesContainerProps> = (
  {
    messagesContainerRef,
    messages,
    isLoading,
    scrollToBottom,
    messageEndRef,
  }
) => {
  return (
    <StyledMessagesContainer ref={messagesContainerRef}>
      {messages.entries.map((entry, index) => (
        <MessageBubble key={index} $user={entry.role}>
          <RespondCharacter $user={entry.role}>
            {entry.role === "user" ? "You" : "AI"}
          </RespondCharacter>
          <MessageText>
            {entry.role === "AI" && index === messages.entries.length - 1 && isLoading ? (
              <TypingAnimation message={entry.message} isLoading={isLoading} scrollToBottom={scrollToBottom}/>
            ) : (
              <ReactMarkdown components={RendererCode} children={entry.message}/>
            )}
          </MessageText>
        </MessageBubble>
      ))}
      <div ref={messageEndRef}/>
    </StyledMessagesContainer>
  );
}
