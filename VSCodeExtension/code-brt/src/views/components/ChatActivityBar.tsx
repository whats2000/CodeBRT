import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider, FloatButton, Tooltip } from 'antd';
import { ControlOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';

import { AppDispatch, RootState } from '../redux';
import { UPLOADED_FILES_KEY } from '../../constants';
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
import { initModelService } from '../redux/slices/modelServiceSlice';
import { fetchSettings } from '../redux/slices/settingsSlice';

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [floatButtonBaseYPosition, setFloatButtonBaseYPosition] = useState(60);
  const [floatButtonsXPosition, setFloatButtonsXPosition] = useState(0);
  const [isModelAdvanceSettingBarOpen, setIsModelAdvanceSettingBarOpen] =
    useState(false);

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
  const tempIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load the settings
    dispatch(fetchSettings())
      .then(() => {
        // Load the lasted used model service
        dispatch(initModelService());
      })
      .then(() => {
        // Load the lasted used conversation history
        dispatch(initLoadHistory());
      })
      .catch(console.error);

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
    localStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    tempIdRef.current = conversationHistory.tempId;
  }, [conversationHistory.tempId]);

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
  }): Promise<void> => {
    if (
      isProcessing ||
      activeModelService === 'loading...' ||
      !message.trim()
    ) {
      return;
    }
    setIsProcessing(true);

    // TODO: Support PDF Extractor at later version current only pass the images
    files = files.filter((file: string) => !file.endsWith('.pdf'));

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
          dispatch(clearUploadedFiles());
        }

        setTimeout(() => {
          setIsProcessing(false);
        }, 1000);
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

  return (
    <ConfigProvider theme={theme}>
      <Container ref={dropRef}>
        <Toolbar setTheme={setTheme} />
        <MessagesContainer
          isProcessing={isProcessing}
          processMessage={processMessage}
        />
        <InputContainer
          inputContainerRef={inputContainerRef}
          processMessage={processMessage}
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
