import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { RendererCode } from "../common/RenderCode";
import styled from "styled-components";

import { ConversationHistory } from "../../types/conversationHistory";
import { ModelType } from "../../types/modelType";
import { WebviewContext } from "../WebviewContext";
import { TypingAnimation } from "../common/TypingAnimation";
import { CopyButton } from "../common/CopyButton";
import { EditIcon } from "../../icons";

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
  color: lightgrey;
  position: relative;
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

const EditButton = styled.button`
  color: white;
  position: absolute;
  top: 5px;
  right: 35px;
  background-color: transparent;
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

const EditInput = styled.textarea`
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  box-sizing: border-box;
  background-color: transparent;
  color: lightgrey;
  border: none;
  border-radius: 4px;
  resize: none;
  overflow: hidden;

  &:focus {
    outline: none;
  }
`;

const Button = styled.button<{ $user: string }>`
  color: white;
  background-color: ${({$user}) => $user === "user" ? "#333" : "#666"};
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  margin-top: 5px;
  cursor: pointer;
  outline: none;

  &:hover {
    background-color: #555;
  }
`;

interface MessagesContainerProps {
  modelType: ModelType;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messages: ConversationHistory;
  isLoading: boolean;
  scrollToBottom: () => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

export const MessagesContainer: React.FC<MessagesContainerProps> = (
  {
    modelType,
    messagesContainerRef,
    messages,
    isLoading,
    scrollToBottom,
    messageEndRef,
  }
) => {
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const {callApi} = React.useContext(WebviewContext);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(prevState => ({...prevState, [index]: true}));
        setTimeout(() => setCopied(prevState => ({...prevState, [index]: false})), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    setEditedMessage(input.value);
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  };


  const handleEdit = (index: number, message: string) => {
    setEditingIndex(index);
    setEditedMessage(message);
    setTimeout(() => {
      const input: HTMLTextAreaElement | null = document.querySelector(`#edit-input-${index}`);
      if (input) {
        input.style.height = `${input.scrollHeight}px`;
      }
    }, 0);
  };

  const handleSaveEdit = (index: number) => {
    callApi("editLanguageModelConversationHistory", modelType, index, editedMessage)
      .then(() => {
        const updatedMessages = [...messages.entries];
        updatedMessages[index].message = editedMessage;
        setEditingIndex(null);
      })
      .catch(err => console.error('Failed to save edited message:', err));
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <StyledMessagesContainer ref={messagesContainerRef}>
      {messages.entries.map((entry, index) => (
        <MessageBubble key={index} $user={entry.role}>
          <EditButton onClick={() => editingIndex === index ? handleCancelEdit() : handleEdit(index, entry.message)}>
            <EditIcon/>
          </EditButton>
          <CopyButton copied={copied[index]} handleCopy={() => handleCopy(entry.message, index)}/>
          <RespondCharacter $user={entry.role}>
            {/* Use First character uppercase */}
            {entry.role === "AI" ? modelType.charAt(0).toUpperCase() + modelType.slice(1) : "You"}
          </RespondCharacter>
          {index === editingIndex ? (
            <>
              <EditInput
                id={`edit-input-${index}`}
                value={editedMessage}
                onChange={handleInput}
                autoFocus
              />
              <Button $user={entry.role} onClick={() => handleSaveEdit(index)}>Save</Button>
              <Button $user={entry.role} onClick={handleCancelEdit}>Cancel</Button>
            </>
          ) : (
            <MessageText>
              {entry.role === "AI" && index === messages.entries.length - 1 && isLoading ? (
                <TypingAnimation message={entry.message} isLoading={isLoading} scrollToBottom={scrollToBottom}/>
              ) : (
                <ReactMarkdown components={RendererCode} children={entry.message}/>
              )}
            </MessageText>
          )}
        </MessageBubble>
      ))}
      <div ref={messageEndRef}/>
    </StyledMessagesContainer>
  );
}
