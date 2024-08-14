import React, { useState, useContext, useEffect } from 'react';
import { Modal, List, Button, Typography, Popconfirm } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';

import type {
  ConversationModelAdvanceSettings,
  SystemPrompt,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';

interface LoadSystemPromptModalProps {
  open: boolean;
  onClose: () => void;
  setNewAdvanceSettings: React.Dispatch<
    React.SetStateAction<ConversationModelAdvanceSettings>
  >;
}

export const LoadSystemPromptModal: React.FC<LoadSystemPromptModalProps> = ({
  open,
  onClose,
  setNewAdvanceSettings,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);

  useEffect(() => {
    if (open) {
      callApi('getSetting', 'systemPrompts').then((response) => {
        setSystemPrompts(response);
      });
    }
  }, [open]);

  const handleLoad = (content: string) => {
    setNewAdvanceSettings((prevSettings) => ({
      ...prevSettings,
      systemPrompt: content,
    }));
    onClose();
  };

  const handleDelete = (id: string) => {
    const updatedPrompts = systemPrompts.filter((prompt) => prompt.id !== id);
    setSystemPrompts(updatedPrompts);

    callApi('setSetting', 'systemPrompts', updatedPrompts).catch((error) => {
      console.error('Failed to delete system prompt:', error);
    });
  };

  return (
    <Modal
      title='Load System Prompt'
      open={open}
      onCancel={onClose}
      footer={[
        <Button key='close' onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <List
        dataSource={systemPrompts}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                type='primary'
                icon={<EyeOutlined />}
                onClick={() => handleLoad(item.content)}
              >
                Load
              </Button>,
              <Popconfirm
                title='Are you sure you want to delete this prompt?'
                onConfirm={() => handleDelete(item.id)}
                okText='Yes'
                cancelText='No'
              >
                <Button danger={true} icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={<Typography.Text>{item.name}</Typography.Text>}
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};
