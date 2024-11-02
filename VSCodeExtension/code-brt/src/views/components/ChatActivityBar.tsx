import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider, FloatButton } from 'antd';
import { ControlOutlined, LoadingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';

import type {
  AddConversationEntryParams,
  GetLanguageModelResponseParams,
} from '../../types';
import type { AppDispatch, RootState } from '../redux';
import { UPLOADED_FILES_KEY } from '../../constants';
import {
  addEntry,
  addTempResponseEntry,
  finishProcessing,
  handleStreamResponse,
  initLoadHistory,
  replaceTempEntry,
  startProcessing,
} from '../redux/slices/conversationSlice';
import { WebviewContext } from '../WebviewContext';
import { useDragAndDrop, useThemeConfig } from '../hooks';
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

  const [floatButtonBaseYPosition, setFloatButtonBaseYPosition] = useState(60);
  const [isModelAdvanceSettingBarOpen, setIsModelAdvanceSettingBarOpen] =
    useState(false);

  const inputContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();

  const { isLoading } = useSelector((state: RootState) => state.settings);

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { activeModelService, selectedModel } = useSelector(
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
      conversationHistory.isProcessing ||
      activeModelService === 'loading...' ||
      !message.trim()
    ) {
      return;
    }
    dispatch(startProcessing());

    // TODO: Support PDF Extractor at later version current only pass the images
    files = files.filter((file: string) => !file.endsWith('.pdf'));

    const userEntry = await callApi('addConversationEntry', {
      parentID: parentId,
      role: 'user',
      message,
      images: files,
    } as AddConversationEntryParams);

    dispatch(addEntry(userEntry));
    dispatch(addTempResponseEntry({ parentId: userEntry.id, role: 'AI' }));

    try {
      const responseWithAction = await callApi('getLanguageModelResponse', {
        modelServiceType: activeModelService,
        query: message,
        images: files.length > 0 ? files : undefined,
        currentEntryID: isEdited ? userEntry.id : undefined,
        useStream: true,
        showStatus: true,
      } as GetLanguageModelResponseParams);

      if (!tempIdRef.current) {
        dispatch(finishProcessing());
        return;
      }

      const aiEntry = await callApi('addConversationEntry', {
        parentID: userEntry.id,
        role: 'AI',
        message: responseWithAction.textResponse,
        modelServiceType: activeModelService,
        modelName: selectedModel,
        toolCalls: responseWithAction.toolCall
          ? [responseWithAction.toolCall]
          : undefined,
      } as AddConversationEntryParams);

      dispatch(replaceTempEntry(aiEntry));

      if (!isEdited) {
        dispatch(clearUploadedFiles());
      }
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
    } finally {
      setTimeout(() => {
        dispatch(finishProcessing());
      }, 1000);
    }
  };

  const openModelAdvanceSettingBar = () => {
    if (conversationHistory.isLoading || isLoading) return;
    setIsModelAdvanceSettingBarOpen(true);
  };

  return (
    <ConfigProvider theme={theme}>
      <Container ref={dropRef}>
        <Toolbar setTheme={setTheme} />
        <MessagesContainer processMessage={processMessage} />
        <InputContainer
          inputContainerRef={inputContainerRef}
          processMessage={processMessage}
        />
      </Container>
      <FloatButton
        tooltip={'Model Advance Settings'}
        icon={
          conversationHistory.isLoading || isLoading ? (
            <LoadingOutlined />
          ) : (
            <ControlOutlined />
          )
        }
        onClick={openModelAdvanceSettingBar}
        style={{
          insetInlineEnd: 40,
          bottom: floatButtonBaseYPosition + 50,
        }}
      />
      <ToolActivateFloatButtons
        floatButtonBaseYPosition={floatButtonBaseYPosition}
      />
      <ModelAdvanceSettingBar
        isOpen={isModelAdvanceSettingBarOpen}
        onClose={() => setIsModelAdvanceSettingBarOpen(false)}
      />
    </ConfigProvider>
  );
};
