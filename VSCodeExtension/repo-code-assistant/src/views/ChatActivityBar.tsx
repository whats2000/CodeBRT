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

const SendButton = styled.button``;

export const ChatActivityBar = () => {
  const { callApi } = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<ConversationHistory>({
    entries: []
  });
  const messageEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    callApi("getConversationHistory")
      .then((history) => {
        if ((history as ConversationHistory).entries.length < 0) return;
        setMessages(history as ConversationHistory);
      })
      .catch((error) => {
        callApi("alertMessage", `Failed to get conversation history: ${error}`, error)
          .catch(console.error);
      });
  }, []);

  const OpenSettings = () => {
    callApi("showSettingsView")
      .catch((error) => console.error("Failed to open settings view:", error));
  }

  const sendMessage = () => {
    if (inputMessage.trim() !== "") {
      callApi("getGeminiResponse", inputMessage)
        .then((response) => {
          if (typeof response !== "string") return;

          setMessages((prevMessages) => ({
              entries: [
                ...prevMessages.entries,
                { role: "user", message: inputMessage },
                { role: "AI", message: response },
              ],
            })
          );
          setInputMessage("");
        })
        .catch((error) => {
          callApi("alertMessage", `Failed to get response: ${error}`, error)
            .catch(console.error);
        });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <MessagesContainer>
        {messages.entries.map((_entry, index) => (
          <>
            <div key={index}>{_entry.role}:</div>
            <div key={index}>{_entry.message}</div>
          </>
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
        />
        <SendButton onClick={sendMessage}>
          Send
        </SendButton>
        <SendButton onClick={OpenSettings}>
          Open Settings
        </SendButton>
      </InputContainer>
    </Container>
  );
};
