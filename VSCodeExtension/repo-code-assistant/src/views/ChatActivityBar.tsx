import { useContext, useState, useEffect, useRef } from "react";
import styled from "styled-components";

import { ConversationHistory } from "../types/conversationHistory";
import { ModelType } from "../types/modelType";
import { WebviewContext } from "./WebviewContext";
import { Toolbar } from "./ChatActivityBar/Toolbar";
import { InputContainer } from "./ChatActivityBar/InputContainer";
import { MessagesContainer } from "./ChatActivityBar/MessagesContainer";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
`;

export const ChatActivityBar = () => {
  const {callApi, addListener, removeListener} = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ConversationHistory>({entries: []});
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeModel: ModelType = "cohere";
  const isNearBottom = () => {
    const threshold = 300;
    if (!messagesContainerRef.current) return false;

    const {scrollTop, scrollHeight, clientHeight} = messagesContainerRef.current;
    const position = scrollHeight - scrollTop - clientHeight;

    return position < threshold;
  };

  // Function to handle incoming streamed responses
  const handleStreamResponse = (responseFromMessage: string) => {
    // Append streamed responses to the latest AI message
    setMessages(prevMessages => {
      const newEntries = [...prevMessages.entries];
      if (newEntries.length > 0 && newEntries[newEntries.length - 1].role === "AI") {
        newEntries[newEntries.length - 1].message += responseFromMessage;
      } else {
        newEntries.push({role: "AI", message: responseFromMessage});
      }

      return {entries: newEntries};
    });
    scrollToBottom();
  };

  useEffect(() => {
    addListener("streamResponse", handleStreamResponse);
    return () => {
      removeListener("streamResponse", handleStreamResponse);
    };
  }, []);

  useEffect(() => {
    callApi("getLanguageModelConversationHistory", activeModel)
      .then((history) => {
        if (history) {
          setMessages(history as ConversationHistory);
        }
      })
      .then(() => {
        setTimeout(() => messageEndRef.current?.scrollIntoView({behavior: "smooth"}), 100);
      })
      .catch((error) =>
        callApi("alertMessage", `Failed to get conversation history: ${error}`, "error")
          .catch(console.error)
      );
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current && isNearBottom()) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Function to send messages and handle responses
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    setIsLoading(true);
    setMessages(prevMessages => ({
      entries: [...prevMessages.entries, {role: "user", message: inputMessage}],
    }));

    callApi("getLanguageModelResponse", inputMessage, activeModel, true)
      .then(() => {
        setInputMessage("");
        setTimeout(() => setIsLoading(false), 1000);
      })
      .catch(error => {
        callApi("alertMessage", `Failed to get response: ${error}`, error).catch(console.error);
        setIsLoading(false);
      });
  };

  return (
    <Container>
      <Toolbar activeModel={activeModel} setMessages={setMessages}/>
      <MessagesContainer
        modelType={activeModel}
        messagesContainerRef={messagesContainerRef}
        messages={messages}
        isLoading={isLoading}
        scrollToBottom={scrollToBottom}
        messageEndRef={messageEndRef}
      />
      <InputContainer
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />
    </Container>
  );
};
