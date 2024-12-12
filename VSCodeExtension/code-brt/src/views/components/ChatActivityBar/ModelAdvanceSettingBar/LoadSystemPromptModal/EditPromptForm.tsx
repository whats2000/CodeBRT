import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
  const [form] = Form.useForm<{
    name: string;
    description: string;
    content: string;
  }>();

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
      title={t('editPromptForm.title')}
      open={open}
      onCancel={onClose}
      zIndex={2000}
      footer={[
        <Button key='cancel' onClick={onClose}>
          {t('cancel')}
        </Button>,
        <Button key='save' type='primary' onClick={handleSave}>
          {t('save')}
        </Button>,
      ]}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          label={t('promptName')}
          name='name'
          rules={[
            { required: true, message: t('editPromptForm.promptNameRequired') },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={t('description')} name='description'>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          label={t('content')}
          name='content'
          rules={[
            { required: true, message: t('editPromptForm.contentRequired') },
          ]}
        >
          <Input.TextArea rows={5} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
