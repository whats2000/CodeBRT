import React, { useContext, useState, useEffect, useRef } from "react";
import { WebviewContext } from "./WebviewContext";
import styled from "styled-components";

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
  const [bMessage, setBMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const messageEndRef = useRef<null | HTMLDivElement>(null);

  const OpenSettings = () => {
    callApi("showSettingsView")
      .catch((error) => console.error("Failed to open settings view:", error));
  }

  const sendMessage = () => {
    if (bMessage.trim() !== "") {
      callApi("sendMessageToExampleB", bMessage)
        .then(() => {
          setMessages((prevMessages) => [...prevMessages, `You: ${bMessage}`]);
          setBMessage("");
        })
        .catch((error) => console.error("Failed to send message:", error));
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
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
        <div ref={messageEndRef} />
      </MessagesContainer>
      <InputContainer>
        <MessageInput
          type="text"
          value={bMessage}
          onChange={(e) => setBMessage(e.target.value)}
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
