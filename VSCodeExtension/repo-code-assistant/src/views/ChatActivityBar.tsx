import React, { useContext, useState, useEffect, useRef } from "react";
import { WebviewContext } from "./WebviewContext";
import styled from "styled-components";

import { ConversationHistory } from "../types/conversationHistory";

import { SettingIcon, CleanHistoryIcon } from "../icons";

// Styled components
const Toolbar = styled.div`
  display: flex;
  justify-content: end;
  padding: 5px;
`;

const ToolbarButton = styled.button`
  padding: 5px;
  color: white;
  background-color: transparent;
  display: flex;
  align-items: center;
  border: none;
  border-radius: 4px;
  
  &:hover {
    background-color: #333;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 10px;
  font-family: Arial, sans-serif;
`;

const MessagesContainer = styled.div`
  overflow-y: auto;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
  flex-grow: 1;
`;

const InputContainer = styled.div`
  display: flex;
`;

const MessageInput = styled.input`
  flex-grow: 1;
  margin-right: 10px;
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #00408a;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border-left-color: #09f;

  animation: spin 1s infinite linear;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const MessageBubble = styled.div<{ $user: string }>`
  display: flex;
  flex-direction: column;
  background-color: ${({$user}) => $user === "user" ? "#666" : "#333"};
  border-radius: 15px;
  padding: 8px 10px;
  margin: 5px;
  align-self: ${({$user}) => $user === "user" ? "flex-end" : "flex-start"};
`;

const RespondCharacter = styled.span<{ $user: string }>`
  color: ${({$user}) => $user === "user" ? "#f0f0f0" : "#09f"};
  font-weight: bold;
  margin-bottom: 5px;
  display: inline-block;
`;

export const ChatActivityBar = () => {
  const {callApi} = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ConversationHistory>({entries: []});
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    callApi("getGeminiConversationHistory")
      .then((history) => {
        if (history) {
          setMessages(history as ConversationHistory);
        }
      })
      .catch((error) =>
        callApi("alertMessage", `Failed to get conversation history: ${error}`, "error")
          .catch(console.error)
      );
  }, []);

  const openSettings = () => {
    callApi("showSettingsView")
      .catch((error) =>
        callApi("alertMessage", `Failed to open settings: ${error}`, "error")
          .catch(console.error)
      );
  }

  const clearHistory = () => {
    callApi("clearGeminiConversationHistory")
      .then(() => setMessages({entries: []}))
      .catch((error) => console.error("Failed to clear conversation history:", error));
  }

  const sendMessage = () => {
    if (inputMessage.trim() !== "") {
      setIsLoading(true);
      callApi("getGeminiResponse", inputMessage)
        .then((response) => {
          setMessages((prevMessages) => ({
            entries: [
              ...prevMessages.entries,
              {role: "user", message: inputMessage},
              {role: "AI", message: response},
            ],
          }) as ConversationHistory);
          setInputMessage("");
          setIsLoading(false);
        })
        .catch((error) => {
          callApi("alertMessage", `Failed to get response: ${error}`, error)
            .catch(console.error);

          setIsLoading(false);
        });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <Container>
      <Toolbar>
        <ToolbarButton onClick={openSettings}>
          <SettingIcon />
        </ToolbarButton>
        <ToolbarButton onClick={clearHistory}>
          <CleanHistoryIcon />
        </ToolbarButton>
      </Toolbar>
      <MessagesContainer>
        {messages.entries.map((msg, index) => (
          <MessageBubble key={index} $user={msg.role}>
            <RespondCharacter $user={msg.role}>
              {msg.role === "AI" ? "AI" : "You"}
            </RespondCharacter>
            <span>{msg.message}</span>
          </MessageBubble>
        ))}
        <div ref={messageEndRef}/>
      </MessagesContainer>
      <InputContainer>
        <MessageInput
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <SendButton onClick={sendMessage} disabled={isLoading}>
          {isLoading ? <Spinner/> : 'Send'}
        </SendButton>
      </InputContainer>
    </Container>
  );
};
