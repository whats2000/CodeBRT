import React, { useState } from 'react';
import { SendIcon, UploadIcon } from '../../icons';
import styled from 'styled-components';

const StyledInputContainer = styled.div`
  display: flex;
  padding: 10px 15px 10px 5px;
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
  handleImageUpload: (files: FileList | null) => void;
}

export const InputContainer = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isLoading,
  handleImageUpload,
}: InputContainerProps) => {
  const [enterPressCount, setEnterPressCount] = useState(0);
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
  };

  return (
    <StyledInputContainer>
      <UploadButton>
        <input type='file' accept='image/*' onChange={handleFileChange} />
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
    </StyledInputContainer>
  );
};
