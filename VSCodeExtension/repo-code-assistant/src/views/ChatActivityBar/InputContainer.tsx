import React, { useState, useContext, useEffect } from 'react';
import { SendIcon, UploadIcon, CloseIcon } from '../../icons'; // Assuming CloseIcon is added to your icons
import styled from 'styled-components';
import { WebviewContext } from '../WebviewContext';

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 15px 10px 10px;
`;

const InputRow = styled.div`
  display: flex;
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

  &:hover {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 0, 0, 0.5);
  }
`;

const MessageInput = styled.textarea`
  flex-grow: 1;
  margin-right: 10px;
  padding: 5px;
  border-radius: 4px;
  background-color: lightgrey;
  min-height: 18px;
  max-height: 50vh;
  height: 18px;

  &:disabled {
    color: #333;
    background-color: #666;
    border: none;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #00408a;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const UploadButton = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 5px;
  margin-right: 10px;

  &:hover {
    background-color: #333;
  }

  input {
    display: none;
  }
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border-left-color: #09f;
  animation: spin 1s infinite linear;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

interface InputContainerProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  uploadedImages: string[];
  handleImageUpload: (files: FileList | null) => void;
  handleImageRemove: (imagePath: string) => void;
}

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
            >
              <CloseIcon />
            </DeleteButton>
          </UploadedImageWrapper>
        ))}
      </UploadedImageContainer>
      <InputRow>
        <UploadButton>
          <input type='file' accept='image/*' onInput={handleFileChange} />
          <UploadIcon />
        </UploadButton>
        <MessageInput
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type your message...'
          disabled={isLoading}
        />
        <SendButton onClick={sendMessage} disabled={isLoading}>
          {isLoading ? <Spinner /> : <SendIcon />}
        </SendButton>
      </InputRow>
    </StyledInputContainer>
  );
};
