import React, { useState, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button, Flex, Input } from 'antd';
import {
  CloseCircleFilled,
  LoadingOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';

import { WebviewContext } from '../../WebviewContext';

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 15px 10px 10px;
`;

const UploadedImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const UploadedImageWrapper = styled.div`
  position: relative;
  margin: 5px 5px 15px;

  &:hover button {
    display: flex;
  }
`;

const UploadedImage = styled.img`
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
`;

const DeleteButton = styled.button`
  display: none;
  position: absolute;
  align-items: center;
  justify-content: center;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  opacity: 0.8;

  &:hover {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
  }
`;

type InputContainerProps = {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  uploadedImages: string[];
  handleImageUpload: (files: FileList | null) => void;
  handleImageRemove: (imagePath: string) => void;
};

export const InputContainer = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isLoading,
  uploadedImages,
  handleImageUpload,
  handleImageRemove,
}: InputContainerProps) => {
  const { callApi } = useContext(WebviewContext);
  const [enterPressCount, setEnterPressCount] = useState(0);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetEnterPressCount = () => setEnterPressCount(0);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (enterPressCount === 0) {
        setTimeout(resetEnterPressCount, 500);
      }
      setEnterPressCount((prev) => prev + 1);

      if (enterPressCount + 1 >= 2 && !isLoading) {
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

  useEffect(() => {
    const updateImageUris = async () => {
      const uris = await Promise.all(
        uploadedImages.map(async (imagePath) => {
          const uri = await callApi('getWebviewUri', imagePath);
          return uri as string;
        }),
      );
      setImageUris(uris);
    };
    updateImageUris().catch((error) => console.error(error));
  }, [uploadedImages, callApi]);

  return (
    <StyledInputContainer>
      <UploadedImageContainer>
        {imageUris.map((imageUri, index) => (
          <UploadedImageWrapper key={index}>
            <UploadedImage src={imageUri} alt={`Uploaded ${index + 1}`} />
            <DeleteButton
              onClick={() => handleImageRemove(uploadedImages[index])}
              disabled={isLoading}
            >
              <CloseCircleFilled />
            </DeleteButton>
          </UploadedImageWrapper>
        ))}
      </UploadedImageContainer>
      <Flex gap={10}>
        <Button onClick={handleUploadButtonClick} disabled={isLoading}>
          <UploadOutlined />
        </Button>
        <input
          type='file'
          accept='image/*'
          ref={fileInputRef}
          onInput={handleFileChange}
          style={{ display: 'none' }}
        />
        <Input.TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type your message...'
          disabled={isLoading}
          autoSize={{ minRows: 1, maxRows: 10 }}
        />
        <Button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? <LoadingOutlined /> : <SendOutlined />}
        </Button>
      </Flex>
    </StyledInputContainer>
  );
};
