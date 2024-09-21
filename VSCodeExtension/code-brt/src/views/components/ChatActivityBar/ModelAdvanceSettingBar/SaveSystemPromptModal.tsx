import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { SystemPrompt } from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';

interface SaveSystemPromptModalProps {
  open: boolean;
  onClose: () => void;
  currentPromptContent: string;
}

export const SaveSystemPromptModal: React.FC<SaveSystemPromptModalProps> = ({
  open,
  onClose,
  currentPromptContent,
}) => {
  const [form] = Form.useForm<{
    name: string;
    description: string;
    content: string;
    tags: string[];
  }>();

  const dispatch = useDispatch<AppDispatch>();

  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings,
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: '',
        description: '',
        content: currentPromptContent,
        tags: [],
      });
    }
  }, [open, currentPromptContent]);

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        const newPrompt: SystemPrompt = {
          id: `prompt-${Date.now()}`,
          name: values.name,
          description: values.description,
          content: values.content,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        dispatch(
          updateAndSaveSetting({
            key: 'systemPrompts',
            value: [...settings.systemPrompts, newPrompt],
          }),
        );
        onClose();
      })
      .catch((error) => {
        console.error('Failed to save system prompt:', error);
      });
  };

  return (
    <Modal
      title='Save System Prompt'
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText='Save'
      cancelText='Cancel'
      loading={isLoading}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          label='Prompt Name'
          name='name'
          rules={[
            { required: true, message: 'Please enter a name for the prompt' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label='Description' name='description'>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
        <Form.Item
          label='Content'
          name='content'
          rules={[
            { required: true, message: 'Please enter the prompt content' },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
