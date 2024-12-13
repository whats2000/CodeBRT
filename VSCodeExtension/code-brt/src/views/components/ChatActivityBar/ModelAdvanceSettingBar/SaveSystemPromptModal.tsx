import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');

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
      title={t('saveSystemPromptModal.title')}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={t('save')}
      cancelText={t('cancel')}
      loading={isLoading}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          label={t('promptName')}
          name='name'
          rules={[
            {
              required: true,
              message: t('saveSystemPromptModal.promptNameRequired'),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={t('description')} name='description'>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
        <Form.Item
          label={t('content')}
          name='content'
          rules={[
            {
              required: true,
              message: t('saveSystemPromptModal.contentRequired'),
            },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
