import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Content } from 'antd/es/layout/layout';

import { ConversationHistory } from '../../types/conversationHistory';
import { ModelType } from '../../types/modelType';
import { WebviewContext } from '../WebviewContext';
import { Toolbar } from './ChatActivityBar/Toolbar';
import { InputContainer } from './ChatActivityBar/InputContainer';
import { MessagesContainer } from './ChatActivityBar/MessagesContainer';

const Container = styled(Content)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
`;

export const ChatActivityBar = () => {
  const { callApi, addListener, removeListener } = useContext(WebviewContext);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ConversationHistory>({
    title: '',
    create_time: 0,
    update_time: 0,
    root: '',
    current: '',
    entries: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelType | 'loading...'>(
    'loading...',
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isActiveModelLoading, setIsActiveModelLoading] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        messageEndRef.current?.scrollIntoView();
      }
    }
  };

  const isNearBottom = () => {
    const threshold = 300;
    if (!messagesContainerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const position = scrollHeight - scrollTop - clientHeight;

    return position < threshold;
  };

  // Function to handle incoming streamed responses
  const handleStreamResponse = (responseFromMessage: string) => {
    setMessages((prevMessages) => {
      const newEntries = { ...prevMessages.entries };
      const currentID = prevMessages.current;

      if (newEntries[currentID] && newEntries[currentID].role === 'AI') {
        newEntries[currentID] = {
          ...newEntries[currentID],
          message: newEntries[currentID].message + responseFromMessage,
        };
      } else {
        const tempId = `temp-${uuidv4()}`;
        newEntries[tempId] = {
          id: tempId,
          role: 'AI',
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
    addListener('streamResponse', handleStreamResponse);
    return () => {
      removeListener('streamResponse', handleStreamResponse);
    };
  }, []);

  useEffect(() => {
    if (activeModel === 'loading...') return;

    callApi('saveLastUsedModel', activeModel).catch((error) =>
      callApi(
        'alertMessage',
        `Failed to save last used model: ${error}`,
        'error',
      ).catch(console.error),
    );
    callApi('getLanguageModelConversationHistory', activeModel)
      .then((history) => {
        if (history) {
          setMessages(history as ConversationHistory);
        }
      })
      .then(() => {
        setTimeout(() => scrollToBottom(), 100);
      })
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to get conversation history: ${error}`,
          'error',
        ).catch(console.error),
      );
  }, [activeModel]);

  useEffect(() => {
    setIsActiveModelLoading(true);
    callApi('getLastUsedModel')
      .then((lastUsedModel) => {
        if (lastUsedModel) {
          setActiveModel(lastUsedModel as ModelType);
        }
        setIsActiveModelLoading(false);
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to get last used model: ${error}`,
          'error',
        ).catch(console.error);
        setIsActiveModelLoading(false);
      });
  }, []);

  // Function to send messages and handle responses
  const sendMessage = async () => {
    if (isLoading) return;
    if (activeModel === 'loading...') return;
    if (!inputMessage.trim()) return;
    setIsLoading(true);

    // Add a user message to conversation history
    const userEntryId = await callApi(
      'addConversationEntry',
      activeModel,
      messages.current,
      'user',
      inputMessage,
      uploadedImages,
    );
    setMessages((prevMessages): ConversationHistory => {
      const updatedEntries = {
        ...prevMessages.entries,
        [userEntryId]: {
          id: userEntryId,
          role: 'user',
          message: inputMessage,
          images: uploadedImages,
          parent: messages.current,
          children: [],
        },
      };

      const parentEntry = updatedEntries[messages.current];
      if (parentEntry) {
        parentEntry.children = [...parentEntry.children, userEntryId];
      }

      return {
        ...prevMessages,
        entries: updatedEntries as ConversationHistory['entries'],
        current: userEntryId,
        root: prevMessages.root === '' ? userEntryId : prevMessages.root,
      };
    });

    // Create a temporary AI response entry
    const tempId = `temp-${uuidv4()}`;
    setMessages((prevMessages) => ({
      ...prevMessages,
      entries: {
        ...prevMessages.entries,
        [tempId]: {
          id: tempId,
          role: 'AI',
          message: '',
          parent: userEntryId,
          children: [],
        },
      },
      current: tempId,
    }));
    scrollToBottom(false);

    try {
      const responseText =
        uploadedImages.length > 0
          ? ((await callApi(
              'getLanguageModelResponseWithImage',
              inputMessage,
              activeModel,
              uploadedImages,
            )) as string)
          : ((await callApi(
              'getLanguageModelResponse',
              inputMessage,
              activeModel,
              true,
            )) as string);

      // Add AI response to conversation history and replace the temporary ID
      const aiEntryId = await callApi(
        'addConversationEntry',
        activeModel,
        userEntryId,
        'AI',
        responseText,
      );
      setMessages((prevMessages) => {
        const newEntries = { ...prevMessages.entries };
        // Update the temporary AI message entry with the actual AI response
        if (newEntries[tempId]) {
          delete newEntries[tempId];
        }
        newEntries[aiEntryId] = {
          id: aiEntryId,
          role: 'AI',
          message: responseText,
          parent: userEntryId,
          children: [],
        };

        const userEntry = newEntries[userEntryId];
        if (userEntry) {
          userEntry.children = [...userEntry.children, aiEntryId];
        }

        return {
          ...prevMessages,
          entries: newEntries,
          current: aiEntryId,
        };
      });

      setInputMessage('');
      setUploadedImages([]);
      setTimeout(() => {
        setIsLoading(false);
        scrollToBottom(true);
      }, 1000);
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
      setIsLoading(false);
    }
  };

  // Function to handle saving an edited user message and generating a new AI response
  const handleEditUserMessageSave = async (
    entryId: string,
    editedMessage: string,
  ) => {
    if (isLoading) return;
    if (activeModel === 'loading...') return;

    const entry = messages.entries[entryId];
    const newEntryId = await callApi(
      'addConversationEntry',
      activeModel,
      entry.parent ?? '',
      'user',
      editedMessage,
      entry.images,
    );

    setMessages((prevMessages): ConversationHistory => {
      const updatedEntries = {
        ...prevMessages.entries,
        [newEntryId]: {
          id: newEntryId,
          role: 'user',
          message: editedMessage,
          images: entry.images,
          parent: entry.parent,
          children: [],
        },
      };

      if (entry.parent) {
        const parentEntry = updatedEntries[entry.parent];
        parentEntry.children = [...parentEntry.children, newEntryId];
      }

      return {
        ...prevMessages,
        entries: updatedEntries as ConversationHistory['entries'],
        current: newEntryId,
      };
    });

    // Create a temporary AI response entry
    const tempId = `temp-${uuidv4()}`;
    setMessages((prevMessages) => ({
      ...prevMessages,
      entries: {
        ...prevMessages.entries,
        [tempId]: {
          id: tempId,
          role: 'AI',
          message: '',
          parent: newEntryId,
          children: [],
        },
      },
      current: tempId,
    }));
    scrollToBottom(false);

    try {
      const responseText =
        entry.images && entry.images.length > 0
          ? ((await callApi(
              'getLanguageModelResponseWithImage',
              editedMessage,
              activeModel,
              entry.images as string[],
              newEntryId,
            )) as string)
          : ((await callApi(
              'getLanguageModelResponse',
              editedMessage,
              activeModel,
              true,
              newEntryId,
            )) as string);

      // Add AI response to conversation history and replace the temporary ID
      const aiEntryId = await callApi(
        'addConversationEntry',
        activeModel,
        newEntryId,
        'AI',
        responseText,
      );
      setMessages((prevMessages) => {
        const newEntries = { ...prevMessages.entries };
        // Update the temporary AI message entry with the actual AI response
        if (newEntries[tempId]) {
          delete newEntries[tempId];
        }
        newEntries[aiEntryId] = {
          id: aiEntryId,
          role: 'AI',
          message: responseText,
          parent: newEntryId,
          children: [],
        };

        const userEntry = newEntries[newEntryId];
        if (userEntry) {
          userEntry.children = [...userEntry.children, aiEntryId];
        }

        return {
          ...prevMessages,
          entries: newEntries,
          current: aiEntryId,
        };
      });

      setTimeout(() => {
        setIsLoading(false);
        scrollToBottom(true);
      }, 1000);
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
      setIsLoading(false);
    }
  };

  // Modified handleImageUpload function
  const handleImageUpload = (files: FileList | null) => {
    if (!(files && files.length > 0)) {
      return;
    }

    const fileArray = Array.from(files);
    fileArray.map((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (reader.result) {
          // Sending the file data as base64 string
          const fileName = await callApi(
            'uploadImage',
            reader.result as string,
          );

          setUploadedImages((prevImages) => [...prevImages, fileName]);
        }
      };
    });
  };

  const handleImageRemove = async (imagePath: string) => {
    await callApi('deleteImage', imagePath);
    setUploadedImages((prev) => prev.filter((path) => path !== imagePath));
  };

  return (
    <Container>
      <Toolbar
        messages={messages}
        activeModel={activeModel}
        isActiveModelLoading={isActiveModelLoading}
        setIsActiveModelLoading={setIsActiveModelLoading}
        setMessages={setMessages}
        setActiveModel={setActiveModel}
      />
      <MessagesContainer
        setMessages={setMessages}
        modelType={activeModel}
        isActiveModelLoading={isActiveModelLoading}
        messagesContainerRef={messagesContainerRef}
        messages={messages}
        isLoading={isLoading}
        scrollToBottom={scrollToBottom}
        messageEndRef={messageEndRef}
        handleEditUserMessageSave={handleEditUserMessageSave}
      />
      <InputContainer
        uploadedImages={uploadedImages}
        handleImageUpload={handleImageUpload}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        isLoading={isLoading}
        handleImageRemove={handleImageRemove}
      />
    </Container>
  );
};
