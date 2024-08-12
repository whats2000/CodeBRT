import React, { useContext, useState } from 'react';
import { Drawer, Form, InputNumber, Input, Button } from 'antd';

import type {
  ConversationHistory,
  ConversationModelAdvanceSettings,
} from '../../../types';
import { WebviewContext } from '../../WebviewContext';

export interface ModelAdvanceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: ConversationHistory;
  setConversationHistory: React.Dispatch<
    React.SetStateAction<ConversationHistory>
  >;
}

export const ModelAdvanceSettingBar: React.FC<ModelAdvanceSettingsProps> = ({
  isOpen,
  onClose,
  conversationHistory,
  setConversationHistory,
}) => {
  const { callApi } = useContext(WebviewContext);
  const { advancedSettings } = conversationHistory;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const updateAdvancedSettings = async (
    newSettings: ConversationModelAdvanceSettings,
  ) => {
    setLoading(true);
    callApi('updateCurrentHistoryModelAdvanceSettings', newSettings)
      .then(() => {
        setConversationHistory((prev) => ({
          ...prev,
          advancedSettings: newSettings,
        }));
        setLoading(false);
        onClose();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <Drawer
      title='Model Advance Settings'
      placement='left'
      closable={true}
      onClose={onClose}
      open={isOpen}
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={advancedSettings}
        onFinish={updateAdvancedSettings}
      >
        <Form.Item
          label='System Prompt'
          name='systemPrompt'
          rules={[
            { required: true, message: 'Please input the system prompt!' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label='Max Tokens' name='maxTokens'>
          <InputNumber min={1} />
        </Form.Item>

        <Form.Item label='Temperature' name='temperature'>
          <InputNumber min={0} max={1} step={0.01} />
        </Form.Item>

        <Form.Item label='Top P' name='topP'>
          <InputNumber min={0} max={1} step={0.01} />
        </Form.Item>

        <Form.Item label='Top K' name='topK'>
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item label='Presence Penalty' name='presencePenalty'>
          <InputNumber min={0} max={2} step={0.01} />
        </Form.Item>

        <Form.Item label='Frequency Penalty' name='frequencyPenalty'>
          <InputNumber min={0} max={2} step={0.01} />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' loading={loading}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
