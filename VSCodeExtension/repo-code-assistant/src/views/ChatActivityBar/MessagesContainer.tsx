import React, { useContext, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { RendererCode } from "../common/RenderCode";
import styled from "styled-components";

import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";
import { ModelType } from "../../types/modelType";
import { WebviewContext } from "../WebviewContext";
import { TypingAnimation } from "../common/TypingAnimation";
import { CopyButton } from "../common/CopyButton";
import { EditIcon, GoBackIcon, GoForwardIcon } from "../../icons";

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
  background-color: ${({$user}) => ($user === "user" ? "#666" : "#333")};
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
  color: ${({$user}) => ($user === "user" ? "#f0f0f0" : "#09f")};
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
    color: #3c3c3c;
    background-color: #ffffff90;
  }
`;

const NavigationButton = styled.button`
  color: white;
  position: absolute;
  top: 5px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: #3c3c3c;
    background-color: #ffffff90;
  }
`;

const BranchCount = styled.span`
  color: white;
  position: absolute;
  top: 5px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
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
  background-color: ${({$user}) => ($user === "user" ? "#333" : "#666")};
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

const MessageImage = styled.img`
  max-width: 100%;
  border-radius: 10px;
  margin-top: 10px;
`;

interface MessagesContainerProps {
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  modelType: ModelType;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messages: ConversationHistory;
  isLoading: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
  handleEditUserMessageSave: (entryId: string, editedMessage: string) => Promise<void>;  // New prop
}

const traverseHistory = (entries: { [key: string]: ConversationEntry }, current: string) => {
  const history = [];
  let currentEntry = entries[current];

  while (currentEntry) {
    history.push(currentEntry);
    if (currentEntry.parent) {
      currentEntry = entries[currentEntry.parent];
    } else {
      break;
    }
  }

  return history.reverse();
};

export const MessagesContainer: React.FC<MessagesContainerProps> = (
  {
    setMessages,
    modelType,
    messagesContainerRef,
    messages,
    isLoading,
    scrollToBottom,
    messageEndRef,
    handleEditUserMessageSave  // Receive the new handler
  }) => {
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const {callApi} = useContext(WebviewContext);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      for (const entry of Object.values(messages.entries)) {
        if (entry.images) {
          for (const image of entry.images) {
            urls[image] = await callApi("getWebviewUri", image);
          }
        }
      }
      setImageUrls(urls);
    };

    loadImageUrls().then();
  }, [messages.entries, callApi]);

  const handleCopy = (text: string, entryId: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied((prevState) => ({...prevState, [entryId]: true}));
        setTimeout(() => setCopied((prevState) => ({...prevState, [entryId]: false})), 2000);
      })
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    setEditedMessage(input.value);
    input.style.height = "auto";
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

  const handleSaveEdit = async (entryId: string) => {
    if (messages.entries[entryId].role === "user") {
      await handleEditUserMessageSave(entryId, editedMessage);
    } else {
      callApi("editLanguageModelConversationHistory", modelType, entryId, editedMessage)
        .then(() => {
          const updatedEntries = {...messages.entries};
          updatedEntries[entryId].message = editedMessage;
          setMessages((prevMessages) => ({
            ...prevMessages,
            entries: updatedEntries,
          }));
        })
        .catch((err) => console.error("Failed to save edited message:", err));
    }
    setEditingEntryId(null);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
  };

  const handleGoForward = (entry: ConversationEntry, direction: 'next' | 'prev') => {
    const parent = entry.parent ? messages.entries[entry.parent] : null;
    if (parent && parent.children.length > 0) {
      const currentIndex = parent.children.indexOf(entry.id);
      let nextIndex = currentIndex;

      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % parent.children.length;
      } else if (direction === 'prev') {
        nextIndex = (currentIndex - 1 + parent.children.length) % parent.children.length;
      }

      const nextChildId = parent.children[nextIndex];
      let nextEntry = messages.entries[nextChildId];

      // Navigate to the leftmost leaf node
      while (nextEntry.children.length > 0) {
        nextEntry = messages.entries[nextEntry.children[0]];
      }

      setMessages((prevMessages) => ({
        ...prevMessages,
        current: nextEntry.id,
      }));
    }
  };

  const conversationHistory = traverseHistory(messages.entries, messages.current);

  return (
    <StyledMessagesContainer ref={messagesContainerRef}>
      {conversationHistory.map((entry) => {
        const parent = entry.parent ? messages.entries[entry.parent] : null;
        const siblingCount = parent ? parent.children.length : 0;
        const currentIndex = parent ? parent.children.indexOf(entry.id) + 1 : 0;

        return (
          <MessageBubble key={entry.id} $user={entry.role}>
            {parent && currentIndex > 1 && (
              <NavigationButton
                onClick={() => handleGoForward(entry, 'prev')}
                style={{right: 120}}
              >
                <GoBackIcon/>
              </NavigationButton>
            )}
            {parent && siblingCount > 1 && (
              <BranchCount style={{right: 90}}>
                {`${currentIndex}/${siblingCount}`}
              </BranchCount>
            )}
            {parent && currentIndex < siblingCount && (
              <NavigationButton
                onClick={() => handleGoForward(entry, 'next')}
                style={{right: 65}}
              >
                <GoForwardIcon/>
              </NavigationButton>
            )}
            {(messages.root !== entry.id && messages.root !== "") && (
              <EditButton
                onClick={() => (editingEntryId === entry.id ? handleCancelEdit() : handleEdit(entry.id, entry.message))}>
                <EditIcon/>
              </EditButton>
            )}

            <CopyButton copied={copied[entry.id]} handleCopy={() => handleCopy(entry.message, entry.id)}/>
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
              <>
                <MessageText>
                  {entry.role === "AI" && entry.id === messages.current && isLoading ? (
                    <TypingAnimation message={entry.message} isLoading={isLoading} scrollToBottom={scrollToBottom}/>
                  ) : (
                    <ReactMarkdown components={RendererCode} children={entry.message}/>
                  )}
                </MessageText>
                {entry.images && entry.images.map((image, index) => (
                  <MessageImage key={index} src={imageUrls[image] || image} alt="Referenced Image"/>
                ))}
              </>
            )}
          </MessageBubble>
        );
      })}
      <div ref={messageEndRef}/>
    </StyledMessagesContainer>
  );
};
