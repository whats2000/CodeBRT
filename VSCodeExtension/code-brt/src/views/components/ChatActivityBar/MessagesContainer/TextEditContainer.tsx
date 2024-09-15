import React from 'react';
import { Button, Input, Space, theme } from 'antd';
import styled from 'styled-components';

import type { ConversationEntry } from '../../../../types';

const EditInputTextArea = styled(Input.TextArea)`
  background-color: transparent;
  color: ${({ theme }) => theme.colorText};
  border: none;
  border-radius: 4px;
  resize: none;
  overflow: hidden;
  margin-top: 10px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colorPrimary};
  }
`;

type MessageEditContainerProps = {
  entry: ConversationEntry;
  isProcessing: boolean;
  editedMessage: string;
  setEditedMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSaveEdit: (entryId: string, message: string) => void;
  handleCancelEdit: () => void;
};

export const TextEditContainer: React.FC<MessageEditContainerProps> = ({
  entry,
  isProcessing,
  editedMessage,
  setEditedMessage,
  handleSaveEdit,
  handleCancelEdit,
}) => {
  const token = theme.useToken();

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    setEditedMessage(input.value);
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  };

  return (
    <Space direction={'vertical'}>
      <EditInputTextArea
        id={`edit-input-${entry.id}`}
        value={editedMessage}
        onChange={handleInput}
        theme={token}
      />
      <Button
        onClick={() => handleSaveEdit(entry.id, editedMessage)}
        style={{ width: '100%' }}
        disabled={isProcessing}
      >
        Save
      </Button>
      <Button onClick={handleCancelEdit} style={{ width: '100%' }}>
        Cancel
      </Button>
    </Space>
  );
};
