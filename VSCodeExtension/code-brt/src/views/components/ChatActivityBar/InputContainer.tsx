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

import type { AppDispatch, RootState } from '../../redux';
import { WebviewContext } from '../../WebviewContext';
import { useClipboardImage, useWindowSize } from '../../hooks';
import {
  deleteFile,
  handleFilesUpload,
} from '../../redux/slices/fileUploadSlice';

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
  inputContainerRef: React.RefObject<HTMLDivElement>;
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  isProcessing: boolean;
};

export const InputContainer = ({
  inputContainerRef,
  inputMessage,
  setInputMessage,
  sendMessage,
  isProcessing,
}: InputContainerProps) => {
  const { callApi } = useContext(WebviewContext);
  const [enterPressCount, setEnterPressCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { uploadedFiles } = useSelector((state: RootState) => state.fileUpload);

  useClipboardImage((files) => dispatch(handleFilesUpload(files)));

  const { innerWidth } = useWindowSize();

  useEffect(() => {
    // Note: The link will break in vscode webview, so we need to remove the href attribute to prevent it.
    const links = document.querySelectorAll<HTMLLinkElement>('a');
    links.forEach((link) => {
      link.href = '';
    });
  }, [fileList]);

  const resetEnterPressCount = () => setEnterPressCount(0);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (enterPressCount === 0) {
        setTimeout(resetEnterPressCount, 500);
      }
      setEnterPressCount((prev) => prev + 1);

      if (enterPressCount + 1 >= 2 && !isProcessing) {
        sendMessage();
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
          fileList={fileList}
          listType='picture-card'
          onRemove={handleRemove}
          onPreview={handlePreview}
          supportServerRender={false}
        />
      </UploadedImageContainer>
      <Flex gap={10}>
        <Button
          type={'text'}
          icon={<UploadOutlined />}
          onClick={handleUploadButtonClick}
          disabled={isProcessing}
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
          type={'text'}
          icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
          onClick={handleVoiceInput}
          disabled={isProcessing}
        />
        <Input.TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            innerWidth > 520
              ? 'Paste images or hold SHIFT key drop them...'
              : 'Ask...'
          }
          disabled={isProcessing}
          autoSize={{ minRows: 1, maxRows: 10 }}
          allowClear
        />
        <Flex vertical={true}>
          <Button onClick={sendMessage} disabled={isProcessing}>
            {isProcessing ? <LoadingOutlined /> : <SendOutlined />}
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
    </StyledInputContainer>
  );
};
