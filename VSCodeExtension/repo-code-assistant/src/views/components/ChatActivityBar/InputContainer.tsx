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

import { WebviewContext } from '../../WebviewContext';
import { useClipboardImage } from '../../hooks';

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
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  isProcessing: boolean;
  uploadedImages: string[];
  handleImageUpload: (files: FileList | null) => void;
  handleImageRemove: (imagePath: string) => void;
};

export const InputContainer = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isProcessing,
  uploadedImages,
  handleImageUpload,
  handleImageRemove,
}: InputContainerProps) => {
  const { callApi } = useContext(WebviewContext);
  const [enterPressCount, setEnterPressCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useClipboardImage((files) => handleImageUpload(files));

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
    handleImageUpload(event.target.files);
    event.target.value = '';
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVoiceInput = async () => {
    try {
      const voiceInput = await callApi('convertVoiceToText');
      setInputMessage((prev) => prev + voiceInput);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const updateImageUris = async () => {
      const urls = await Promise.all(
        uploadedImages.map(async (imagePath) => {
          const uri = await callApi('getWebviewUri', imagePath);
          return uri as string;
        }),
      );
      setFileList(
        urls.map((url, index) => ({
          uid: index.toString(),
          name: `image-${index + 1}`,
          status: 'done',
          url,
        })),
      );
    };
    updateImageUris().catch((error) => console.error(error));
  }, [uploadedImages, callApi]);

  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    handleImageRemove(uploadedImages[index]);
    setFileList(newFileList);
  };

  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  return (
    <StyledInputContainer>
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
          accept='image/*'
          ref={fileInputRef}
          onInput={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          type={'text'}
          icon={<AudioOutlined />}
          onClick={handleVoiceInput}
          disabled={isProcessing}
        />
        <Input.TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type your message...'
          disabled={isProcessing}
          autoSize={{ minRows: 1, maxRows: 10 }}
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
