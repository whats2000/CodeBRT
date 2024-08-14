import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';

import type { SystemPrompt } from '../../../../../types';

type EditPromptFormProps = {
  open: boolean;
  prompt: SystemPrompt | null;
  onClose: () => void;
  onSave: (updatedPrompt: SystemPrompt) => void;
};

export const EditPromptForm: React.FC<EditPromptFormProps> = ({
  open,
  prompt,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && prompt) {
      form.setFieldsValue({
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
      });
    }
  }, [open, prompt, form]);

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        onSave({
          ...prompt!,
          ...values,
          updatedAt: Date.now(),
        });
        onClose();
      })
      .catch(() => {});
  };

  return (
    <Modal
      title='Edit System Prompt'
      open={open}
      onCancel={onClose}
      zIndex={2000}
      footer={[
        <Button key='cancel' onClick={onClose}>
          Cancel
        </Button>,
        <Button key='save' type='primary' onClick={handleSave}>
          Save
        </Button>,
      ]}
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
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          label='Content'
          name='content'
          rules={[
            { required: true, message: 'Please enter the prompt content' },
          ]}
        >
          <Input.TextArea rows={5} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
