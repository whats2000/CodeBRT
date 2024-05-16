import { useContext, useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

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
  const { callApi, addListener, removeListener } = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ConversationHistory>({
    title: '',
    create_time: 0,
    update_time: 0,
    root: '',
    current: '',
    entries: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelType>("gemini");

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        messageEndRef.current?.scrollIntoView();
      }
    }
  };

  const isNearBottom = () => {
    const threshold = 300;
    if (!messagesContainerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const position = scrollHeight - scrollTop - clientHeight;

    return position < threshold;
  };

  // Function to handle incoming streamed responses
  const handleStreamResponse = (responseFromMessage: string) => {
    setMessages(prevMessages => {
      const newEntries = { ...prevMessages.entries };
      const currentID = prevMessages.current;

      if (newEntries[currentID] && newEntries[currentID].role === "AI") {
        newEntries[currentID] = {
          ...newEntries[currentID],
          message: newEntries[currentID].message + responseFromMessage,
        };
      } else {
        const tempId = `temp-${uuidv4()}`;
        newEntries[tempId] = {
          id: tempId,
          role: "AI",
          message: responseFromMessage,
          parent: currentID,
          children: [],
        };
        prevMessages.current = tempId;
      }
      return { ...prevMessages, entries: newEntries };
    });
    if (isNearBottom()) {
      scrollToBottom(false);
    }
  };

  useEffect(() => {
    addListener("streamResponse", handleStreamResponse);
    return () => {
      removeListener("streamResponse", handleStreamResponse);
    };
  }, []);

  useEffect(() => {
    callApi("saveLastUsedModel", activeModel)
      .catch(error =>
        callApi("alertMessage", `Failed to save last used model: ${error}`, "error")
          .catch(console.error)
      );
    callApi("getLanguageModelConversationHistory", activeModel)
      .then((history) => {
        if (history) {
          setMessages(history as ConversationHistory);
        }
      })
      .then(() => {
        setTimeout(() => scrollToBottom(), 100);
      })
      .catch((error) =>
        callApi("alertMessage", `Failed to get conversation history: ${error}`, "error")
          .catch(console.error)
      );
  }, [activeModel]);

  useEffect(() => {
    callApi("getLastUsedModel")
      .then((lastUsedModel) => {
        if (lastUsedModel) {
          setActiveModel(lastUsedModel as ModelType);
        }
      })
      .catch((error) =>
        callApi("alertMessage", `Failed to get last used model: ${error}`, "error")
          .catch(console.error)
      );
  }, []);

  // Function to send messages and handle responses
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    setIsLoading(true);

    // Add a user message to conversation history
    const userEntryId = await callApi("addConversationEntry", activeModel, messages.current, "user", inputMessage);
    setMessages(prevMessages => ({
      ...prevMessages,
      entries: {
        ...prevMessages.entries,
        [userEntryId]: {
          id: userEntryId,
          role: "user",
          message: inputMessage,
          parent: messages.current,
          children: [],
        },
      },
      current: userEntryId,
    }));

    // Create a temporary AI response entry
    const tempId = `temp-${uuidv4()}`;
    setMessages(prevMessages => ({
      ...prevMessages,
      entries: {
        ...prevMessages.entries,
        [tempId]: {
          id: tempId,
          role: "AI",
          message: "",
          parent: userEntryId,
          children: [],
        },
      },
      current: tempId,
    }));
    scrollToBottom(false);

    try {
      const responseText = await callApi("getLanguageModelResponse", inputMessage, activeModel, true) as string;

      // Add AI response to conversation history and replace the temporary ID
      const aiEntryId = await callApi("addConversationEntry", activeModel, userEntryId, "AI", responseText);
      setMessages(prevMessages => {
        const newEntries = { ...prevMessages.entries };
        // Update the temporary AI message entry with the actual AI response
        if (newEntries[tempId]) {
          delete newEntries[tempId];
        }
        newEntries[aiEntryId] = {
          id: aiEntryId,
          role: "AI",
          message: responseText,
          parent: userEntryId,
          children: [],
        };
        return {
          ...prevMessages,
          entries: newEntries,
          current: aiEntryId,
        };
      });

      setInputMessage("");
      setTimeout(() => {
        setIsLoading(false);
        scrollToBottom(true);
      }, 1000);
    } catch (error) {
      callApi("alertMessage", `Failed to get response: ${error}`, "error").catch(console.error);
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Toolbar activeModel={activeModel} setMessages={setMessages} setActiveModel={setActiveModel} />
      <MessagesContainer
        setMessages={setMessages}
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
