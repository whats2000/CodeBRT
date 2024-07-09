import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider } from 'antd';

import type { ConversationHistory, ModelType } from '../../types';
import { INPUT_MESSAGE_KEY, UPLOADED_IMAGES_KEY } from '../../constants';
import { WebviewContext } from '../WebviewContext';
import { Toolbar } from './ChatActivityBar/Toolbar';
import { InputContainer } from './ChatActivityBar/InputContainer';
import { MessagesContainer } from './ChatActivityBar/MessagesContainer';
import { useThemeConfig } from '../hooks/useThemeConfig';

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

  const [inputMessage, setInputMessage] = useState(
    localStorage.getItem(INPUT_MESSAGE_KEY) || '',
  );
  const [conversationHistory, setConversationHistory] =
    useState<ConversationHistory>({
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
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    JSON.parse(localStorage.getItem(UPLOADED_IMAGES_KEY) || '[]'),
  );
  const [isActiveModelLoading, setIsActiveModelLoading] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const theme = useThemeConfig();

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

  const handleStreamResponse = (responseFromMessage: string) => {
    setConversationHistory((prevMessages) => {
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

    callApi('setSetting', 'lastUsedModel', activeModel).catch((error) =>
      callApi(
        'alertMessage',
        `Failed to save last used model: ${error}`,
        'error',
      ).catch(console.error),
    );
    callApi('getLanguageModelConversationHistory', activeModel)
      .then((history) => {
        if (history) {
          setConversationHistory(history as ConversationHistory);
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
    callApi('getSetting', 'lastUsedModel')
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

  useEffect(() => {
    localStorage.setItem(INPUT_MESSAGE_KEY, inputMessage);
  }, [inputMessage]);

  useEffect(() => {
    localStorage.setItem(UPLOADED_IMAGES_KEY, JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  const sendMessage = async () => {
    if (isLoading) return;
    if (activeModel === 'loading...') return;
    if (!inputMessage.trim()) return;
    setIsLoading(true);

    const userEntryId = await callApi(
      'addConversationEntry',
      activeModel,
      conversationHistory.current,
      'user',
      inputMessage,
      uploadedImages,
    );
    setConversationHistory((prevMessages): ConversationHistory => {
      const updatedEntries = {
        ...prevMessages.entries,
        [userEntryId]: {
          id: userEntryId,
          role: 'user',
          message: inputMessage,
          images: uploadedImages,
          parent: conversationHistory.current,
          children: [],
        },
      };

      const parentEntry = updatedEntries[conversationHistory.current];
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

    const tempId = `temp-${uuidv4()}`;
    setConversationHistory((prevMessages) => ({
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

      const aiEntryId = await callApi(
        'addConversationEntry',
        activeModel,
        userEntryId,
        'AI',
        responseText,
      );
      setConversationHistory((prevMessages) => {
        const newEntries = { ...prevMessages.entries };
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

  const handleEditUserMessageSave = async (
    entryId: string,
    editedMessage: string,
  ) => {
    if (isLoading) return;
    if (activeModel === 'loading...') return;

    const entry = conversationHistory.entries[entryId];
    const newEntryId = await callApi(
      'addConversationEntry',
      activeModel,
      entry.parent ?? '',
      'user',
      editedMessage,
      entry.images,
    );

    setConversationHistory((prevMessages): ConversationHistory => {
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

    const tempId = `temp-${uuidv4()}`;
    setConversationHistory((prevMessages) => ({
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

      const aiEntryId = await callApi(
        'addConversationEntry',
        activeModel,
        newEntryId,
        'AI',
        responseText,
      );
      setConversationHistory((prevMessages) => {
        const newEntries = { ...prevMessages.entries };
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
    <ConfigProvider theme={theme}>
      <Container>
        <Toolbar
          conversationHistory={conversationHistory}
          activeModel={activeModel}
          isActiveModelLoading={isActiveModelLoading}
          setIsActiveModelLoading={setIsActiveModelLoading}
          setConversationHistory={setConversationHistory}
          setActiveModel={setActiveModel}
        />
        <MessagesContainer
          conversationHistory={conversationHistory}
          setConversationHistory={setConversationHistory}
          modelType={activeModel}
          isActiveModelLoading={isActiveModelLoading}
          messagesContainerRef={messagesContainerRef}
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
    </ConfigProvider>
  );
};
