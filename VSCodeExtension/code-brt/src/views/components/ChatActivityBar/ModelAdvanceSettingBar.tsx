import React, { useContext, useState, useEffect } from 'react';
import {
  Drawer,
  InputNumber,
  Input,
  Button,
  Row,
  Col,
  Form,
  Typography,
  Tooltip,
  Space,
  Flex,
} from 'antd';
import {
  ClearOutlined,
  ImportOutlined,
  QuestionCircleFilled,
  SaveOutlined,
} from '@ant-design/icons';

import type {
  ConversationHistory,
  ConversationModelAdvanceSettings,
} from '../../../types';
import { WebviewContext } from '../../WebviewContext';
import { MODEL_ADVANCE_SETTINGS } from '../../../constants';

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
  const { advanceSettings } = conversationHistory;

  const [newAdvanceSettings, setNewAdvanceSettings] =
    useState<ConversationModelAdvanceSettings>(advanceSettings);
  const [showMoreInfoSettingName, setShowMoreInfoSettingName] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      setNewAdvanceSettings(advanceSettings);
    } else {
      handleSave();
    }
  }, [isOpen]);

  const handleSave = () => {
    callApi('updateCurrentHistoryModelAdvanceSettings', newAdvanceSettings)
      .then(() => {
        setConversationHistory((prev) => ({
          ...prev,
          advanceSettings: newAdvanceSettings,
        }));
      })
      .catch((err) => console.error('Failed to save settings:', err));
  };

  const handleInputChange = (
    field: keyof ConversationModelAdvanceSettings,
    value: number | string | null,
  ) => {
    setNewAdvanceSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearField = (field: keyof ConversationModelAdvanceSettings) => {
    if (field === 'systemPrompt') {
      setNewAdvanceSettings((prev) => ({
        ...prev,
        systemPrompt: 'You are a helpful assistant.',
      }));
      return;
    }

    setNewAdvanceSettings((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  return (
    <Drawer
      title='Model Advance Settings'
      placement='left'
      closable={true}
      onClose={onClose}
      open={isOpen}
    >
      {Object.entries(newAdvanceSettings).map(([key, value]) => (
        <>
          <Form.Item
            label={
              <Space>
                <span>
                  {key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
                <Tooltip title='Click to show more information'>
                  <Typography.Link
                    type={'secondary'}
                    onClick={() =>
                      setShowMoreInfoSettingName(
                        showMoreInfoSettingName === key ? null : key,
                      )
                    }
                  >
                    <QuestionCircleFilled />
                  </Typography.Link>
                </Tooltip>
              </Space>
            }
            layout={'vertical'}
            key={key}
          >
            {key === 'systemPrompt' ? (
              <Input.TextArea
                value={newAdvanceSettings.systemPrompt || ''}
                onChange={(e) =>
                  handleInputChange('systemPrompt', e.target.value)
                }
                placeholder='Enter system prompt'
                autoSize={{ minRows: 2, maxRows: 10 }}
                allowClear
              />
            ) : (
              <Row gutter={8} align={'middle'}>
                <Col flex={'auto'}>
                  <InputNumber
                    max={
                      MODEL_ADVANCE_SETTINGS[
                        key as keyof ConversationModelAdvanceSettings
                      ].range.max
                    }
                    min={
                      MODEL_ADVANCE_SETTINGS[
                        key as keyof ConversationModelAdvanceSettings
                      ].range.min
                    }
                    style={{ width: '100%' }}
                    value={value as number | null}
                    onChange={(val) =>
                      handleInputChange(
                        key as keyof ConversationModelAdvanceSettings,
                        val,
                      )
                    }
                    placeholder={`Enter ${key}`}
                    changeOnWheel={true}
                  />
                </Col>
                <Col>
                  {key !== 'systemPrompt' && (
                    <Tooltip title='Clear field' placement={'right'}>
                      <Button
                        type='text'
                        danger={true}
                        icon={<ClearOutlined />}
                        onClick={() =>
                          clearField(
                            key as keyof ConversationModelAdvanceSettings,
                          )
                        }
                      />
                    </Tooltip>
                  )}
                </Col>
              </Row>
            )}
          </Form.Item>
          {key === 'systemPrompt' && (
            <Flex
              justify={'space-between'}
              style={{ width: '100%', marginBottom: 20 }}
            >
              <Button>
                <ImportOutlined /> Load
              </Button>
              <Button>
                <SaveOutlined /> Save
              </Button>
              <Button danger={true} onClick={() => clearField('systemPrompt')}>
                <ClearOutlined /> Set Default
              </Button>
            </Flex>
          )}
          {showMoreInfoSettingName === key && (
            <Typography.Paragraph type={'secondary'}>
              {
                MODEL_ADVANCE_SETTINGS[
                  key as keyof ConversationModelAdvanceSettings
                ].description
              }{' '}
              {MODEL_ADVANCE_SETTINGS[
                key as keyof ConversationModelAdvanceSettings
              ].link && (
                <Typography.Link
                  type={'warning'}
                  href={
                    MODEL_ADVANCE_SETTINGS[
                      key as keyof ConversationModelAdvanceSettings
                    ].link
                  }
                  target='_blank'
                  rel='noreferrer'
                >
                  Learn more
                </Typography.Link>
              )}
            </Typography.Paragraph>
          )}
        </>
      ))}
      <Button
        type='primary'
        ghost={true}
        onClick={onClose}
        style={{ marginTop: 20, width: '100%' }}
      >
        Close and Save
      </Button>
    </Drawer>
  );
};
