import React, { useContext, useState, useEffect } from 'react';
import {
  Drawer,
  InputNumber,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Tooltip,
  Space,
  Form,
} from 'antd';
import {
  ClearOutlined,
  ImportOutlined,
  QuestionCircleFilled,
  SaveOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { ConversationModelAdvanceSettings } from '../../../types';
import type { RootState } from '../../redux';
import { WebviewContext } from '../../WebviewContext';
import { MODEL_ADVANCE_SETTINGS } from '../../../constants';
import { SaveSystemPromptModal } from './ModelAdvanceSettingBar/SaveSystemPromptModal';
import { LoadSystemPromptBar } from './ModelAdvanceSettingBar/LoadSystemPromptBar';
import { setAdvanceSettings } from '../../redux/slices/conversationSlice';

const DEFAULT_ADVANCE_SETTINGS: ConversationModelAdvanceSettings = {
  systemPrompt: 'You are a helpful assistant.',
  maxTokens: undefined,
  temperature: undefined,
  topP: undefined,
  topK: undefined,
  presencePenalty: undefined,
  frequencyPenalty: undefined,
};

export type ModelAdvanceSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ModelAdvanceSettingBar: React.FC<ModelAdvanceSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);

  const dispatch = useDispatch();
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );

  const { advanceSettings } = conversationHistory;

  const [newAdvanceSettings, setNewAdvanceSettings] =
    useState<ConversationModelAdvanceSettings>(advanceSettings);
  const [showMoreInfoSettingName, setShowMoreInfoSettingName] = useState<
    string | null
  >(null);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [loadPromptOpen, setLoadPromptOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewAdvanceSettings({
        ...DEFAULT_ADVANCE_SETTINGS,
        ...advanceSettings,
      });
    } else {
      handleSave().then();
    }
  }, [isOpen]);

  const handleSave = async () => {
    const sanitizedSettings = Object.fromEntries(
      Object.entries(newAdvanceSettings).filter(
        ([_, value]) => value !== null && value !== undefined,
      ),
    ) as ConversationModelAdvanceSettings;

    try {
      await callApi(
        'updateHistoryModelAdvanceSettings',
        conversationHistory.root,
        sanitizedSettings,
      );
      dispatch(setAdvanceSettings(sanitizedSettings));

      await callApi(
        'setSetting',
        'lastUsedSystemPrompt',
        sanitizedSettings.systemPrompt,
      );
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
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
    setNewAdvanceSettings((prev) => ({
      ...prev,
      [field]: field === 'systemPrompt' ? 'You are a helpful assistant.' : null,
    }));
  };

  const handleMoreInfoToggle = (key: string) => {
    setShowMoreInfoSettingName(showMoreInfoSettingName === key ? null : key);
  };

  const renderFormItem = (key: string, value: number | string | null) => (
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
              onClick={() => handleMoreInfoToggle(key)}
            >
              <QuestionCircleFilled />
            </Typography.Link>
          </Tooltip>
        </Space>
      }
      key={key}
      layout={'vertical'}
    >
      {key === 'systemPrompt' ? (
        <Input.TextArea
          value={(value as string) || ''}
          onChange={(e) =>
            handleInputChange(
              key as keyof ConversationModelAdvanceSettings,
              e.target.value,
            )
          }
          placeholder='Enter system prompt'
          autoSize={{ minRows: 2, maxRows: 10 }}
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
            <Tooltip title='Clear field' placement={'right'}>
              <Button
                type='text'
                danger
                icon={<ClearOutlined />}
                onClick={() =>
                  clearField(key as keyof ConversationModelAdvanceSettings)
                }
              />
            </Tooltip>
          </Col>
        </Row>
      )}
    </Form.Item>
  );

  return (
    <>
      <Drawer
        title='Model Advance Settings'
        placement='left'
        closable={true}
        onClose={onClose}
        open={isOpen}
      >
        {Object.entries(newAdvanceSettings).map(([key, value]) => (
          <React.Fragment key={key}>
            {renderFormItem(key, value as number | string | null)}
            {key === 'systemPrompt' && (
              <Space
                style={{
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: 20,
                }}
                wrap={true}
              >
                <Button onClick={() => setLoadPromptOpen(true)}>
                  <ImportOutlined /> Load
                </Button>
                <Button onClick={() => setSavePromptOpen(true)}>
                  <SaveOutlined /> Save
                </Button>
                <Button danger onClick={() => clearField('systemPrompt')}>
                  <ClearOutlined /> Set Default
                </Button>
              </Space>
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
                    href={
                      MODEL_ADVANCE_SETTINGS[
                        key as keyof ConversationModelAdvanceSettings
                      ].link
                    }
                    target='_blank'
                    rel='noreferrer'
                    type={'warning'}
                  >
                    Learn more
                  </Typography.Link>
                )}
              </Typography.Paragraph>
            )}
          </React.Fragment>
        ))}
        <Button
          type='primary'
          ghost
          onClick={onClose}
          style={{ marginTop: 20, width: '100%' }}
        >
          Close and Save
        </Button>
      </Drawer>
      <SaveSystemPromptModal
        open={savePromptOpen}
        onClose={() => setSavePromptOpen(false)}
        currentPromptContent={newAdvanceSettings.systemPrompt}
      />
      <LoadSystemPromptBar
        open={loadPromptOpen}
        onClose={() => setLoadPromptOpen(false)}
        setNewAdvanceSettings={setNewAdvanceSettings}
      />
    </>
  );
};
