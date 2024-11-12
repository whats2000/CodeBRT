import { useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Content } from 'antd/es/layout/layout';
import { ConfigProvider } from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import type { AppDispatch, RootState } from '../redux';
import { UPLOADED_FILES_KEY } from '../../constants';
import {
  handleStreamResponse,
  initLoadHistory,
} from '../redux/slices/conversationSlice';
import { WebviewContext } from '../WebviewContext';
import { RefProvider } from '../context/RefContext';
import { useDragAndDrop, useThemeConfig } from '../hooks';
import { Toolbar } from './ChatActivityBar/Toolbar';
import { InputContainer } from './ChatActivityBar/InputContainer';
import { MessagesContainer } from './ChatActivityBar/MessagesContainer';
import { ToolActivateFloatButtons } from './ChatActivityBar/ToolActivateFloatButtons';
import { ModelAdvanceSettingBar } from './ChatActivityBar/ModelAdvanceSettingBar';
import { handleFilesUpload } from '../redux/slices/fileUploadSlice';
import { initModelService } from '../redux/slices/modelServiceSlice';
import { fetchSettings } from '../redux/slices/settingsSlice';
import { UserGuildTours } from './ChatActivityBar/UserGuildTours';
import { setRefId, startTourForNewUser } from '../redux/slices/tourSlice';

const Container = styled(Content)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
`;

export const ChatActivityBar = () => {
  const { addListener, removeListener } = useContext(WebviewContext);

  const [floatButtonBaseYPosition, setFloatButtonBaseYPosition] = useState(60);

  const inputContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
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
      .then(() => {
        // Check if the user is new and start the quick start tour
        dispatch(startTourForNewUser());
      })
      .catch(console.error);

    dispatch(
      setRefId({
        tourName: 'quickStart',
        stepIndex: 5,
        targetId: 'modelAdvanceSettingButton',
      }),
    );

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

  return (
    <ConfigProvider theme={theme}>
      <RefProvider>
        <Container ref={dropRef}>
          <Toolbar setTheme={setTheme} />
          <MessagesContainer tempIdRef={tempIdRef} />
          <InputContainer
            tempIdRef={tempIdRef}
            inputContainerRef={inputContainerRef}
          />
        </Container>
        <ModelAdvanceSettingBar
          floatButtonBaseYPosition={floatButtonBaseYPosition}
        />
        <ToolActivateFloatButtons
          floatButtonBaseYPosition={floatButtonBaseYPosition}
        />
        <UserGuildTours />
      </RefProvider>
    </ConfigProvider>
  );
};
