import React, { useContext, useState, useEffect, useRef } from "react";
import { WebviewContext } from "./WebviewContext";
import styled from "styled-components";
import { ConversationHistory } from "../types/conversationHistory";

// Styled components
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
  border: 1px solid #ccc;
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


export const ChatActivityBar = () => {
  const {callApi} = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<ConversationHistory>({entries: []});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageEndRef = useRef<null | HTMLDivElement>(null);

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

  const OpenSettings = () => {
    callApi("showSettingsView")
      .catch((error) => console.error("Failed to open settings view:", error));
  }

  const sendMessage = () => {
    if (inputMessage.trim() !== "") {
      setIsLoading(true);  // Set loading to true
      callApi("getGeminiResponse", inputMessage)
        .then((response) => {
          if (typeof response !== "string") return;

          setMessages((prevMessages) => ({
            entries: [
              ...prevMessages.entries,
              {role: "user", message: inputMessage},
              {role: "AI", message: response},
            ],
          }));
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
    messageEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  return (
    <Container>
      <MessagesContainer>
        {messages.entries.map((entry, index) => (
          <div key={index}>
            {entry.role}: {entry.message}
          </div>
        ))}
        <div ref={messageEndRef}/>
      </MessagesContainer>
      <InputContainer>
        <MessageInput
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <SendButton onClick={sendMessage} disabled={isLoading}>
          {isLoading ? <Spinner/> : 'Send'}
        </SendButton>
        <SendButton onClick={OpenSettings} disabled={isLoading}>
          Open Settings
        </SendButton>
      </InputContainer>
    </Container>
  );
};
