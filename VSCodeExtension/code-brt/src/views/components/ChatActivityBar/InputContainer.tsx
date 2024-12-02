import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { UploadFile } from 'antd/lib/upload/interface';
import { Button, Flex, Input, Image, Upload, Tag } from 'antd';
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
import { useClipboardFiles, useWindowSize } from '../../hooks';
import {
  deleteFile,
  handleFilesUpload,
} from '../../redux/slices/fileUploadSlice';
import { CancelOutlined } from '../../icons';
import { INPUT_MESSAGE_KEY } from 'src/constants';
import {
  processMessage,
  processToolCall,
} from '../../redux/slices/conversationSlice';
import { setRefId } from '../../redux/slices/tourSlice';

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 15px 10px 10px;
`;

const UploadedImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StyledUpload = styled(Upload)`
  div.ant-upload-list-item-container {
    margin-bottom: 10px;
  }
`;

type InputContainerProps = {
  tempIdRef: React.MutableRefObject<string | null>;
  inputContainerRef: React.RefObject<HTMLDivElement>;
};

export const InputContainer = React.memo<InputContainerProps>(
  ({ tempIdRef, inputContainerRef }) => {
    const { addListener, callApi, removeListener } = useContext(WebviewContext);
    const { registerRef } = useRefs();
    const [enterPressCount, setEnterPressCount] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [inputMessage, setInputMessage] = useState(
      localStorage.getItem(INPUT_MESSAGE_KEY) || '',
    );
    const [refSelectedCode, setRefSelectedCode] = useState<SelectedCode[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFileButtonRef = registerRef('uploadFileButton');
    const voiceInputButtonRef = registerRef('voiceInputButton');
    const inputMessageRef = registerRef('inputMessage');

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

    const { settings } = useSelector((state: RootState) => state.settings);

    useClipboardFiles((files) => dispatch(handleFilesUpload(files)));

    const { innerWidth } = useWindowSize();

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
      dispatch(
        setRefId({
          tourName: 'quickStart',
          targetId: 'inputMessage',
          stepIndex: 3,
        }),
      );
    }, [dispatch]);

    useEffect(() => {
      addListener(
        'sendCodeToChat',
        ({ codeText, codeLanguage, relativePath }) => {
          // Append a formatted code block to the input message
          setInputMessage(
            `${inputMessage}\n\n### ${relativePath}\n\`\`\`${codeLanguage}\n${codeText}\n\`\`\``,
          );
        },
      );

      return () => {
        removeListener('sendCodeToChat', () => {});
      };
    }, []);

    useEffect(() => {
      // Note: The link will break in vscode webview, so we need to remove the href attribute to prevent it.
      const links = document.querySelectorAll<HTMLLinkElement>('a');
      links.forEach((link) => {
        link.href = '';
      });
    }, [fileList]);

    const resetEnterPressCount = () => setEnterPressCount(0);

    const currentEntry =
      conversationHistory.entries[conversationHistory.current];
    const isToolResponse = currentEntry?.role === 'tool';

    const sendMessage = async () => {
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
            rejectByUserMessage: inputMessage,
            tempIdRef,
          }),
        );
        setInputMessage('');
        localStorage.setItem(INPUT_MESSAGE_KEY, '');
        return;
      }

      dispatch(
        processMessage({
          message: inputMessage,
          parentId: conversationHistory.current,
          tempIdRef,
          files: uploadedFiles,
        }),
      ).then(() => {
        setInputMessage('');
        localStorage.setItem(INPUT_MESSAGE_KEY, '');
      });
    };

    const handleKeyDown = async (
      event: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      if (conversationHistory.isProcessing) {
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        const doubleEnterSendMessages = settings.doubleEnterSendMessages;

        if (!doubleEnterSendMessages) {
          await sendMessage();
          return;
        }

        event.preventDefault();
        if (enterPressCount === 0) {
          setTimeout(resetEnterPressCount, 500);
        }
        setEnterPressCount((prev) => prev + 1);

        if (enterPressCount + 1 >= 2 && !conversationHistory.isProcessing) {
          await sendMessage();
          resetEnterPressCount();
        }
      } else {
        resetEnterPressCount();
      }
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

    useEffect(() => {
      const updateImageUris = async () => {
        const urls = await Promise.all(
          uploadedFiles.map(async (filePath) => {
            const uri = await callApi('getWebviewUri', filePath);
            return uri as string;
          }),
        );

        setFileList(
          urls.map((url, index) => ({
            uid: index.toString(),
            name: uploadedFiles[index].split('\\').pop() as string,
            status: 'done',
            url,
          })),
        );
      };
      updateImageUris().catch((error) => console.error(error));
    }, [uploadedFiles, callApi]);

    const handleRemove = (file: UploadFile) => {
      const index = fileList.indexOf(file);
      const newFileList = [...fileList];
      newFileList.splice(index, 1);
      dispatch(deleteFile(uploadedFiles[index]));
      setFileList(newFileList);
    };

    const handlePreview = async (file: UploadFile) => {
      if (
        !file.url
          ?.split('.')
          .pop()
          ?.match(/(png|jpe?g|gif|webp)/i)
      ) {
        return;
      }

      setPreviewImage(file.url || (file.preview as string));
      setPreviewOpen(true);
    };

    const handleCancelResponse = () => {
      if (activeModelService === 'loading...') {
        return;
      }

      callApi('stopLanguageModelResponse', activeModelService).catch(
        console.error,
      );
    };

    const handleInputMessageChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setInputMessage(e.target.value);
      localStorage.setItem(INPUT_MESSAGE_KEY, e.target.value);
    };

    return (
      <StyledInputContainer ref={inputContainerRef}>
        {previewImage && (
          <Image
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(''),
            }}
            src={previewImage}
          />
        )}
        <UploadedImageContainer>
          <StyledUpload
            fileList={conversationHistory.isProcessing ? [] : fileList}
            listType='picture-card'
            onRemove={handleRemove}
            onPreview={handlePreview}
            supportServerRender={false}
          />
        </UploadedImageContainer>
        <Flex gap={10} wrap={innerWidth < 320}>
          <Button
            ref={uploadFileButtonRef}
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
            type={'text'}
            icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
            onClick={handleVoiceInput}
            disabled={conversationHistory.isProcessing}
          />
          <Flex gap={10} style={{ width: '100%' }} ref={inputMessageRef}>
            <Input.TextArea
              value={inputMessage}
              onChange={handleInputMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={innerWidth > 520 ? 'Paste images...' : 'Ask...'}
              disabled={conversationHistory.isProcessing || isToolResponse}
              autoSize={{
                minRows: 1,
                maxRows: conversationHistory.isProcessing ? 2 : 10,
              }}
              allowClear
            />
            <Flex vertical={true}>
              <Button
                onClick={
                  conversationHistory.isProcessing
                    ? handleCancelResponse
                    : sendMessage
                }
                disabled={isToolResponse}
              >
                {conversationHistory.isProcessing ? (
                  <CancelOutlined />
                ) : (
                  <SendOutlined />
                )}
              </Button>
              {inputMessage.length > 100 && (
                <Tag
                  color='warning'
                  style={{ marginTop: 5, width: '100%', textAlign: 'center' }}
                >
                  {inputMessage.length}
                </Tag>
              )}
            </Flex>
          </Flex>
        </Flex>
      </StyledInputContainer>
    );
  },
);
