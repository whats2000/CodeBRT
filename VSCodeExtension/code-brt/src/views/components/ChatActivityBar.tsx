import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider, FloatButton, Tooltip } from 'antd';
import { ControlOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';

import { AppDispatch, RootState } from '../redux';
import { INPUT_MESSAGE_KEY, UPLOADED_FILES_KEY } from '../../constants';
import {
  addEntry,
  addTempAIResponseEntry,
  handleStreamResponse,
  initLoadHistory,
  replaceTempEntry,
} from '../redux/slices/conversationSlice';
import { WebviewContext } from '../WebviewContext';
import { useDragAndDrop, useThemeConfig, useWindowSize } from '../hooks';
import { Toolbar } from './ChatActivityBar/Toolbar';
import { InputContainer } from './ChatActivityBar/InputContainer';
import { MessagesContainer } from './ChatActivityBar/MessagesContainer';
import { ToolActivateFloatButtons } from './ChatActivityBar/ToolActivateFloatButtons';
import { ModelAdvanceSettingBar } from './ChatActivityBar/ModelAdvanceSettingBar';
import {
  handleFilesUpload,
  clearUploadedFiles,
} from '../redux/slices/fileUploadSlice';
import {
  loadModelService,
  startLoading,
} from '../redux/slices/modelServiceSlice';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [floatButtonBaseYPosition, setFloatButtonBaseYPosition] = useState(60);
  const [floatButtonsXPosition, setFloatButtonsXPosition] = useState(0);
  const [isModelAdvanceSettingBarOpen, setIsModelAdvanceSettingBarOpen] =
    useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { activeModelService } = useSelector(
    (state: RootState) => state.modelService,
  );
  const uploadedFiles = useSelector(
    (state: RootState) => state.fileUpload.uploadedFiles,
  );

  const [theme, setTheme] = useThemeConfig();

  const dropRef = useDragAndDrop((files) => dispatch(handleFilesUpload(files)));
  const bufferRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tempIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load the lasted used conversation history
    dispatch(initLoadHistory()).then(() => {
      scrollToBottom(false);
    });

    // For receiving stream response
    const handleStreamResponseEvent = (responseFromMessage: string) => {
      bufferRef.current += responseFromMessage;

      if (!isProcessingRef.current) {
        isProcessingRef.current = true;

        setTimeout(() => {
          if (bufferRef.current) {
            dispatch(handleStreamResponse(bufferRef.current));
            bufferRef.current = '';
          }

          isProcessingRef.current = false;
        }, 100);
      }
    };

    // Add listener for stream response
    addListener('streamResponse', handleStreamResponseEvent);

    return () => {
      removeListener('streamResponse', handleStreamResponseEvent);
    };
  }, [dispatch]);

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

  useEffect(() => {
    const initModelService = async () => {
      dispatch(startLoading());

      try {
        const lastUsedModelService = await callApi(
          'getSetting',
          'lastUsedModelService',
        );
        if (lastUsedModelService) {
          dispatch(loadModelService(lastUsedModelService));
        }
      } catch (error) {
        callApi(
          'alertMessage',
          `Failed to clear conversation history: ${error}`,
          'error',
        ).catch(console.error);
      }
    };

    initModelService().catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem(INPUT_MESSAGE_KEY, inputMessage);
  }, [inputMessage]);

  useEffect(() => {
    localStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    tempIdRef.current = conversationHistory.tempId;
  }, [conversationHistory.tempId]);

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

  const startScrollInterval = () => {
    if (!processingIntervalRef.current) {
      processingIntervalRef.current = setInterval(() => {
        if (isNearBottom()) {
          scrollToBottom(false);
        }
      }, 50);
    }
  };

  const stopScrollInterval = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const processMessage = async ({
    message,
    parentId,
    files = [],
    isEdited = false,
  }: {
    message: string;
    parentId: string;
    files?: string[];
    isEdited?: boolean;
  }) => {
    if (
      isProcessing ||
      activeModelService === 'loading...' ||
      !message.trim()
    ) {
      return;
    }
    setIsProcessing(true);
    startScrollInterval();

    const userEntry = await callApi(
      'addConversationEntry',
      parentId,
      'user',
      message,
      files,
      activeModelService,
    );

    dispatch(addEntry(userEntry));
    dispatch(addTempAIResponseEntry({ parentId: userEntry.id }));

    callApi(
      'getLanguageModelResponse',
      activeModelService,
      message,
      files.length > 0 ? files : undefined,
      isEdited ? userEntry.id : undefined,
      true,
      true,
    )
      .then(async (response) => {
        const responseText = await response;
        if (!tempIdRef.current) {
          stopScrollInterval();
          setIsProcessing(false);
          return;
        }

        const aiEntry = await callApi(
          'addConversationEntry',
          userEntry.id,
          'AI',
          responseText,
          undefined,
          activeModelService,
        );

        dispatch(replaceTempEntry(aiEntry));

        if (!isEdited) {
          setInputMessage('');
          dispatch(clearUploadedFiles());
        }

        setTimeout(() => {
          stopScrollInterval();
          setIsProcessing(false);
        }, 500);
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to get response: ${error}`,
          'error',
        ).catch(console.error);
        setIsProcessing(false);
      });
  };

  const sendMessage = async () => {
    await processMessage({
      message: inputMessage,
      parentId: conversationHistory.current,
      files: uploadedFiles,
    });
  };

  const handleEditUserMessageSave = async (
    entryId: string,
    editedMessage: string,
  ) => {
    const entry = conversationHistory.entries[entryId];
    await processMessage({
      message: editedMessage,
      parentId: entry.parent ?? '',
      files: entry.images,
      isEdited: true,
    });
  };

  return (
    <ConfigProvider theme={theme}>
      <Container ref={dropRef}>
        <Toolbar setTheme={setTheme} />
        <MessagesContainer
          messagesContainerRef={messagesContainerRef}
          isProcessing={isProcessing}
          messageEndRef={messageEndRef}
          handleEditUserMessageSave={handleEditUserMessageSave}
        />
        <InputContainer
          inputContainerRef={inputContainerRef}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          isProcessing={isProcessing}
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
      />
    </ConfigProvider>
  );
};
