import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button, Flex, GlobalToken, Space, theme, Typography } from 'antd';
import {
  AudioOutlined,
  LoadingOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { SelectedCode } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import { WebviewContext } from '../../WebviewContext';
import { useRefs } from '../../context/RefContext';
import { useClipboardFiles } from '../../hooks';
import { handleFilesUpload } from '../../redux/slices/fileUploadSlice';
import { INPUT_MESSAGE_KEY } from 'src/constants';
import {
  processMessage,
  processToolCall,
} from '../../redux/slices/conversationSlice';
import { setRefId } from '../../redux/slices/tourSlice';
import { SelectedCodeDisplay } from './InputContainer/SelectedCodeDisplay';
import { MentionsDisplay } from './InputContainer/MentionsDisplay';
import { InputMessageArea } from './InputContainer/InputMessageArea';
import { FileUploadSection } from './InputContainer/FileUploadSection';
import { CancelOutlined } from '../../icons';
import { AutoApproveConfig } from './InputContainer/AutoApproveConfig';

const StyledInputContainer = styled.div<{ $token: GlobalToken }>`
  display: flex;
  flex-direction: column;
  padding: 10px 15px 10px 10px;
  background-color: ${({ $token }) => $token.colorBorder};
  border-radius: 5px;
  margin-bottom: 10px;
`;

type InputContainerProps = {
  tempIdRef: React.MutableRefObject<string | null>;
  inputContainerRef: React.RefObject<HTMLDivElement>;
};

export const InputContainer = React.memo<InputContainerProps>(
  ({ tempIdRef, inputContainerRef }) => {
    const { token } = theme.useToken();
    const { addListener, callApi, removeListener } = useContext(WebviewContext);
    const { registerRef } = useRefs();
    const [isRecording, setIsRecording] = useState(false);
    const [inputMessage, setInputMessage] = useState(
      localStorage.getItem(INPUT_MESSAGE_KEY) || '',
    );
    const [refSelectedCode, setRefSelectedCode] = useState<SelectedCode[]>([]);
    const [visibleMentions, setVisibleMentions] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFileButtonRef = registerRef('uploadFileButton');
    const voiceInputButtonRef = registerRef('voiceInputButton');

    const dispatch = useDispatch<AppDispatch>();
    const { uploadedFiles } = useSelector(
      (state: RootState) => state.fileUpload,
    );
    const { activeModelService } = useSelector(
      (state: RootState) => state.modelService,
    );

    const conversationHistory = useSelector(
      (state: RootState) => state.conversation,
    );

    useClipboardFiles((files) => dispatch(handleFilesUpload(files)));

    useEffect(() => {
      dispatch(
        setRefId({
          tourName: 'quickStart',
          targetId: 'uploadFileButton',
          stepIndex: 1,
        }),
      );
      dispatch(
        setRefId({
          tourName: 'quickStart',
          targetId: 'voiceInputButton',
          stepIndex: 2,
        }),
      );
    }, [dispatch]);

    useEffect(() => {
      addListener('sendCodeToChat', (newSelectedCode) => {
        // Append to the array of selected codes
        setRefSelectedCode((prev) => [...prev, newSelectedCode]);
      });

      return () => {
        removeListener('sendCodeToChat', () => {});
      };
    }, [addListener, removeListener]);

    useEffect(() => {
      const mentions = inputMessage.match(/[@#][\w-]+:[\w-\\/.]+\s/g) || [];
      const uniqueMentions = Array.from(new Set(mentions));
      setVisibleMentions(uniqueMentions);
    }, [inputMessage]);

    const currentEntry =
      conversationHistory.entries[conversationHistory.current];
    const isToolResponse = currentEntry?.role === 'tool';

    // Function to remove a specific selected code item
    const removeSelectedCode = (id: string) => {
      setRefSelectedCode((prev) => prev.filter((code) => code.id !== id));
    };

    const resetInputMessage = () => {
      setInputMessage('');
      setRefSelectedCode([]);
      setVisibleMentions([]);
      localStorage.setItem(INPUT_MESSAGE_KEY, '');
    };

    const sendMessage = async () => {
      // Prepare an input message with selected code
      let finalMessage = inputMessage;

      // Append selected code to the message
      if (refSelectedCode.length > 0) {
        const codeBlocks = refSelectedCode
          .map(
            (code) =>
              `### Partial Code snippet from \n${code.relativePath} in line position ${code.startLine}-${code.endLine}:\n\`\`\`${code.codeLanguage}\n${code.codeText}\n\`\`\``,
          )
          .join('\n\n');

        finalMessage = `${finalMessage}\n\n${codeBlocks}`;
      }

      // Append visible mentions context to the message
      if (visibleMentions.length > 0) {
        const fileFoldersMentions = visibleMentions.filter((mention) =>
          mention.startsWith('#'),
        );

        const fileFoldersContext = await callApi(
          'getFileContexts',
          fileFoldersMentions,
        );

        finalMessage = `${finalMessage}\n\n${fileFoldersContext}`;

        const problemMentions = visibleMentions.filter((mention) =>
          mention.startsWith('@'),
        );

        const problemContext = await callApi(
          'getProblemsContext',
          problemMentions,
        );

        finalMessage = `${finalMessage}\n\n${problemContext}`;
      }

      // If the current entry is a tool response, we need to prevent a sending message from the input
      if (isToolResponse) {
        return;
      }
      const toolCall = currentEntry?.toolCalls?.[0];

      if (toolCall) {
        // If the current entry is a tool call.
        // We use response for the tool call instead of the input message
        dispatch(
          processToolCall({
            toolCall: toolCall,
            entry: currentEntry,
            activeModelService,
            rejectByUserMessage: finalMessage,
            tempIdRef,
            files: uploadedFiles,
          }),
        );
        resetInputMessage();
        return;
      }

      dispatch(
        processMessage({
          message: finalMessage,
          parentId: conversationHistory.current,
          tempIdRef,
          files: uploadedFiles,
        }),
      ).then(() => {
        resetInputMessage();
      });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      dispatch(handleFilesUpload(event.target.files));
      event.target.value = '';
    };

    const handleUploadButtonClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleVoiceInput = async () => {
      if (isRecording) {
        callApi('stopRecordVoice').then(() =>
          setTimeout(() => setIsRecording(false), 500),
        );
        return;
      }
      setIsRecording(true);
      try {
        const voiceInput = await callApi('convertVoiceToText');
        setInputMessage((prev) => prev + voiceInput);
      } catch (error) {
        console.error(error);
      }
      setIsRecording(false);
    };

    const removeMention = (mention: string) => {
      const updatedMentions = visibleMentions.filter((m) => m !== mention);
      setVisibleMentions(updatedMentions);
      const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const updatedMessage = inputMessage.replace(
        new RegExp(escapedMention, 'g'),
        '',
      );
      setInputMessage(updatedMessage);
    };

    const handleCancelResponse = () => {
      if (activeModelService === 'loading...') {
        return;
      }

      callApi('stopLanguageModelResponse', activeModelService).catch(
        console.error,
      );
    };

    return (
      <StyledInputContainer ref={inputContainerRef} $token={token}>
        <SelectedCodeDisplay
          selectedCodes={refSelectedCode}
          onRemoveCode={removeSelectedCode}
        />
        <MentionsDisplay
          visibleMentions={visibleMentions}
          removeMention={removeMention}
        />
        <FileUploadSection />
        <Space direction={'vertical'} size={5}>
          <InputMessageArea
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            conversationHistory={conversationHistory}
            sendMessage={sendMessage}
            isToolResponse={isToolResponse}
          />
          <Flex justify={'space-between'}>
            <Flex>
              <Button
                ref={uploadFileButtonRef}
                size={'small'}
                type={'text'}
                icon={<UploadOutlined />}
                onClick={handleUploadButtonClick}
                disabled={conversationHistory.isProcessing}
              />
              <input
                type='file'
                accept='.png,.jpg,.jpeg,.gif,.webp,.pdf'
                multiple={true}
                ref={fileInputRef}
                onInput={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                ref={voiceInputButtonRef}
                size={'small'}
                type={'text'}
                icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
                onClick={handleVoiceInput}
                disabled={conversationHistory.isProcessing}
              />
              <AutoApproveConfig />
            </Flex>
            <Space>
              {inputMessage.length > 0 && (
                <Typography.Text type={'secondary'}>
                  {inputMessage.length}
                </Typography.Text>
              )}
              <Button
                size={'small'}
                type={'text'}
                onClick={
                  conversationHistory.isProcessing
                    ? handleCancelResponse
                    : sendMessage
                }
                disabled={isToolResponse}
                icon={
                  conversationHistory.isProcessing ? (
                    <CancelOutlined />
                  ) : (
                    <SendOutlined />
                  )
                }
              />
            </Space>
          </Flex>
        </Space>
      </StyledInputContainer>
    );
  },
);
