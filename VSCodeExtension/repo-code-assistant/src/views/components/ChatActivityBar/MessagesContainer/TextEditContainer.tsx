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
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSaveEdit: (entryId: string) => void;
  handleCancelEdit: () => void;
};

export const TextEditContainer: React.FC<MessageEditContainerProps> = ({
  entry,
  isProcessing,
  editedMessage,
  handleInput,
  handleSaveEdit,
  handleCancelEdit,
}) => {
  const token = theme.useToken();

  return (
    <Space direction={'vertical'}>
      <EditInputTextArea
        id={`edit-input-${entry.id}`}
        value={editedMessage}
        onChange={handleInput}
        autoFocus
        theme={token}
      />
      <Button
        onClick={() => handleSaveEdit(entry.id)}
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
