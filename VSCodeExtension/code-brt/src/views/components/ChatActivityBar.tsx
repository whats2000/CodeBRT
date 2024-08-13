import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { v4 as uuidV4 } from 'uuid';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider, FloatButton, Tooltip } from 'antd';
import { ControlOutlined } from '@ant-design/icons';

import type { ConversationHistory, ModelServiceType } from '../../types';
import { INPUT_MESSAGE_KEY, UPLOADED_IMAGES_KEY } from '../../constants';
import { WebviewContext } from '../WebviewContext';
import { useDragAndDrop, useThemeConfig, useWindowSize } from '../hooks';
import { Toolbar } from './ChatActivityBar/Toolbar';
import { InputContainer } from './ChatActivityBar/InputContainer';
import { MessagesContainer } from './ChatActivityBar/MessagesContainer';
import { ToolActivateFloatButtons } from './ChatActivityBar/ToolActivateFloatButtons';
import { ModelAdvanceSettingBar } from './ChatActivityBar/ModelAdvanceSettingBar';

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
  const { innerWidth } = useWindowSize();

  const [inputMessage, setInputMessage] = useState(
    localStorage.getItem(INPUT_MESSAGE_KEY) || '',
  );
  const [conversationHistory, setConversationHistory] =
    useState<ConversationHistory>({
      create_time: 0,
      update_time: 0,
      root: '',
      top: [],
      current: '',
      advanceSettings: {
        systemPrompt: '',
        maxTokens: undefined,
        temperature: undefined,
        topP: undefined,
        topK: undefined,
        presencePenalty: undefined,
        frequencyPenalty: undefined,
      },
      entries: {},
    });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeModelService, setActiveModelService] = useState<
    ModelServiceType | 'loading...'
  >('loading...');
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    JSON.parse(localStorage.getItem(UPLOADED_IMAGES_KEY) || '[]'),
  );
  const [isActiveModelLoading, setIsActiveModelLoading] = useState(false);
  const [floatButtonBaseYPosition, setFloatButtonBaseYPosition] = useState(60);
  const [floatButtonsXPosition, setFloatButtonsXPosition] = useState(0);
  const [isModelAdvanceSettingBarOpen, setIsModelAdvanceSettingBarOpen] =
    useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useThemeConfig();

  const dropRef = useDragAndDrop((files) => handleImageUpload(files));

  useEffect(() => {
    setFloatButtonsXPosition(innerWidth - 84);
  }, [innerWidth]);

  useEffect(() => {
    const updateYPosition = () => {
      if (inputContainerRef.current) {
        const { height } = inputContainerRef.current.getBoundingClientRect();
        setFloatButtonBaseYPosition(height + 20);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateYPosition();
    });

    if (inputContainerRef.current) {
      resizeObserver.observe(inputContainerRef.current);
    }

    // Cleanup the observer on a component unmount
    return () => {
      if (inputContainerRef.current) {
        resizeObserver.unobserve(inputContainerRef.current);
      }
    };
  }, [inputContainerRef]);

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
        const tempId = `temp-${uuidV4()}`;
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
    setIsActiveModelLoading(true);
    // Load the last used model
    callApi('getSetting', 'lastUsedModel')
      .then((lastUsedModel) => {
        if (lastUsedModel) {
          setActiveModelService(lastUsedModel as ModelServiceType);
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

    // Add listener for stream response
    addListener('streamResponse', handleStreamResponse);
    return () => {
      removeListener('streamResponse', handleStreamResponse);
    };
  }, []);

  useEffect(() => {
    if (activeModelService === 'loading...') return;

    callApi('setSetting', 'lastUsedModel', activeModelService).catch((error) =>
      callApi(
        'alertMessage',
        `Failed to save last used model: ${error}`,
        'error',
      ).catch(console.error),
    );
  }, [activeModelService]);

  useEffect(() => {
    localStorage.setItem(INPUT_MESSAGE_KEY, inputMessage);
  }, [inputMessage]);

  useEffect(() => {
    localStorage.setItem(UPLOADED_IMAGES_KEY, JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  const sendMessage = async () => {
    if (isProcessing) return;
    if (activeModelService === 'loading...') return;
    if (!inputMessage.trim()) return;
    setIsProcessing(true);

    const userEntryId = await callApi(
      'addConversationEntry',
      conversationHistory.current,
      'user',
      inputMessage,
      uploadedImages,
      activeModelService,
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
        top: prevMessages.top.length === 0 ? [userEntryId] : prevMessages.top,
        entries: updatedEntries as ConversationHistory['entries'],
        current: userEntryId,
        root: prevMessages.root === '' ? userEntryId : prevMessages.root,
      };
    });

    const tempId = `temp-${uuidV4()}`;
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
      const responseText = (await callApi(
        'getLanguageModelResponse',
        activeModelService,
        inputMessage,
        uploadedImages.length > 0 ? uploadedImages : undefined,
        undefined,
        true,
        true,
      )) as string;

      const aiEntryId = await callApi(
        'addConversationEntry',
        userEntryId,
        'AI',
        responseText,
        undefined,
        activeModelService,
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
        setIsProcessing(false);
        scrollToBottom(true);
      }, 1000);
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
      setIsProcessing(false);
    }
  };

  const handleEditUserMessageSave = async (
    entryId: string,
    editedMessage: string,
  ) => {
    if (isProcessing) return;
    if (activeModelService === 'loading...') return;
    if (!editedMessage.trim()) return;
    setIsProcessing(true);

    const entry = conversationHistory.entries[entryId];
    const newEntryId = await callApi(
      'addConversationEntry',
      entry.parent ?? '',
      'user',
      editedMessage,
      entry.images,
      activeModelService,
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
        top: entry.parent
          ? prevMessages.top
          : [...prevMessages.top, newEntryId],
        entries: updatedEntries as ConversationHistory['entries'],
        current: newEntryId,
      };
    });

    const tempId = `temp-${uuidV4()}`;
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
      const responseText = (await callApi(
        'getLanguageModelResponse',
        activeModelService,
        editedMessage,
        entry.images && entry.images.length > 0 ? entry.images : undefined,
        newEntryId,
        true,
        true,
      )) as string;

      const aiEntryId = await callApi(
        'addConversationEntry',
        newEntryId,
        'AI',
        responseText,
        undefined,
        activeModelService,
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
        setIsProcessing(false);
        scrollToBottom(true);
      }, 1000);
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
      setIsProcessing(false);
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
      <Container ref={dropRef}>
        <Toolbar
          conversationHistory={conversationHistory}
          activeModelService={activeModelService}
          isActiveModelLoading={isActiveModelLoading}
          setIsActiveModelLoading={setIsActiveModelLoading}
          setConversationHistory={setConversationHistory}
          setActiveModelService={setActiveModelService}
          setTheme={setTheme}
        />
        <MessagesContainer
          conversationHistory={conversationHistory}
          setConversationHistory={setConversationHistory}
          modelType={activeModelService}
          isActiveModelLoading={isActiveModelLoading}
          messagesContainerRef={messagesContainerRef}
          isProcessing={isProcessing}
          scrollToBottom={scrollToBottom}
          messageEndRef={messageEndRef}
          handleEditUserMessageSave={handleEditUserMessageSave}
        />
        <InputContainer
          inputContainerRef={inputContainerRef}
          uploadedImages={uploadedImages}
          handleImageUpload={handleImageUpload}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          isProcessing={isProcessing}
          handleImageRemove={handleImageRemove}
        />
      </Container>
      <Tooltip title={'Model Advance Settings'} placement={'left'}>
        <FloatButton
          icon={<ControlOutlined />}
          onClick={() => setIsModelAdvanceSettingBarOpen(true)}
          style={{
            left: floatButtonsXPosition,
            bottom: floatButtonBaseYPosition + 50,
          }}
        />
      </Tooltip>
      <ToolActivateFloatButtons
        floatButtonsXPosition={floatButtonsXPosition}
        floatButtonBaseYPosition={floatButtonBaseYPosition}
      />
      <ModelAdvanceSettingBar
        isOpen={isModelAdvanceSettingBarOpen}
        onClose={() => setIsModelAdvanceSettingBarOpen(false)}
        conversationHistory={conversationHistory}
        setConversationHistory={setConversationHistory}
      />
    </ConfigProvider>
  );
};
