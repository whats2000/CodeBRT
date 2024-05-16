import React, { useState, useContext } from "react";
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
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  modelType: ModelType;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messages: ConversationHistory;
  isLoading: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

export const MessagesContainer: React.FC<MessagesContainerProps> = (
  {
    setMessages,
    modelType,
    messagesContainerRef,
    messages,
    isLoading,
    scrollToBottom,
    messageEndRef,
  }
) => {
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const { callApi } = useContext(WebviewContext);

  const handleCopy = (text: string, entryId: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(prevState => ({...prevState, [entryId]: true}));
        setTimeout(() => setCopied(prevState => ({...prevState, [entryId]: false})), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    setEditedMessage(input.value);
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  };

  const handleEdit = (entryId: string, message: string) => {
    setEditingEntryId(entryId);
    setEditedMessage(message);
    setTimeout(() => {
      const input: HTMLTextAreaElement | null = document.querySelector(`#edit-input-${entryId}`);
      if (input) {
        input.style.height = `${input.scrollHeight}px`;
      }
    }, 0);
  };

  const handleSaveEdit = (entryId: string) => {
    callApi("editLanguageModelConversationHistory", modelType, entryId, editedMessage)
      .then(() => {
        const updatedEntries = { ...messages.entries };
        updatedEntries[entryId].message = editedMessage;
        setMessages(prevMessages => ({
          ...prevMessages,
          entries: updatedEntries,
        }));
        setEditingEntryId(null);
      })
      .catch(err => console.error('Failed to save edited message:', err));
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
  };

  return (
    <StyledMessagesContainer ref={messagesContainerRef}>
      {Object.values(messages.entries).map((entry) => (
        <MessageBubble key={entry.id} $user={entry.role}>
          <EditButton onClick={() => editingEntryId === entry.id ? handleCancelEdit() : handleEdit(entry.id, entry.message)}>
            <EditIcon />
          </EditButton>
          <CopyButton copied={copied[entry.id]} handleCopy={() => handleCopy(entry.message, entry.id)} />
          <RespondCharacter $user={entry.role}>
            {entry.role === "AI" ? modelType.charAt(0).toUpperCase() + modelType.slice(1) : "You"}
          </RespondCharacter>
          {entry.id === editingEntryId ? (
            <>
              <EditInput
                id={`edit-input-${entry.id}`}
                value={editedMessage}
                onChange={handleInput}
                autoFocus
              />
              <Button $user={entry.role} onClick={() => handleSaveEdit(entry.id)}>Save</Button>
              <Button $user={entry.role} onClick={handleCancelEdit}>Cancel</Button>
            </>
          ) : (
            <MessageText>
              {entry.role === "AI" && entry.id === messages.current && isLoading ? (
                <TypingAnimation message={entry.message} isLoading={isLoading} scrollToBottom={scrollToBottom} />
              ) : (
                <ReactMarkdown components={RendererCode} children={entry.message} />
              )}
            </MessageText>
          )}
        </MessageBubble>
      ))}
      <div ref={messageEndRef} />
    </StyledMessagesContainer>
  );
}
