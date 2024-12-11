import React, { useContext, useState, useEffect } from 'react';
import { Drawer, Button, Typography, Space, FloatButton } from 'antd';
import {
  ClearOutlined,
  ControlOutlined,
  ImportOutlined,
  LoadingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { ConversationModelAdvanceSettings } from '../../../types';
import type { RootState } from '../../redux';
import { WebviewContext } from '../../WebviewContext';
import { MODEL_ADVANCE_SETTINGS } from '../../../constants';
import { SaveSystemPromptModal } from './ModelAdvanceSettingBar/SaveSystemPromptModal';
import { LoadSystemPromptBar } from './ModelAdvanceSettingBar/LoadSystemPromptBar';
import { setAdvanceSettings } from '../../redux/slices/conversationSlice';
import { useRefs } from '../../context/RefContext';
import { ModelAdvanceSettingFormItem } from './ModelAdvanceSettingBar/ModelAdvanceSettingFormItem';
import { Entries } from 'type-fest';

const DEFAULT_ADVANCE_SETTINGS: ConversationModelAdvanceSettings = {
  systemPrompt: 'You are a helpful assistant.',
  maxTokens: undefined,
  temperature: undefined,
  topP: undefined,
  topK: undefined,
  presencePenalty: undefined,
  frequencyPenalty: undefined,
  stop: undefined,
};

export type ModelAdvanceSettingsProps = {
  floatButtonBaseYPosition: number;
};

export const ModelAdvanceSettingBar: React.FC<ModelAdvanceSettingsProps> = ({
  floatButtonBaseYPosition,
}) => {
  const { t } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);
  const { registerRef } = useRefs();

  const dispatch = useDispatch();
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { isLoading } = useSelector((state: RootState) => state.settings);

  const { advanceSettings } = conversationHistory;

  const [newAdvanceSettings, setNewAdvanceSettings] =
    useState<ConversationModelAdvanceSettings>(advanceSettings);
  const [showMoreInfoSettingName, setShowMoreInfoSettingName] = useState<
    string | null
  >(null);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [loadPromptOpen, setLoadPromptOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const modelAdvanceSettingButtonRef = registerRef('modelAdvanceSettingButton');

  useEffect(() => {
    if (isOpen) {
      setNewAdvanceSettings({
        ...DEFAULT_ADVANCE_SETTINGS,
        ...advanceSettings,
      });
    } else {
      void handleSave();
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
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleInputChange = <K extends keyof ConversationModelAdvanceSettings>(
    field: K,
    value: ConversationModelAdvanceSettings[K] | null,
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

  const openModelAdvanceSettingBar = () => {
    if (conversationHistory.isLoading || isLoading) return;
    setIsOpen(true);
  };

  return (
    <>
      <div
        ref={modelAdvanceSettingButtonRef}
        style={{
          position: 'absolute',
          insetInlineEnd: 40,
          bottom: floatButtonBaseYPosition + 55,
          height: 40,
          width: 40,
        }}
      />
      <FloatButton
        tooltip={t('modelAdvanceSettings')}
        icon={
          conversationHistory.isLoading || isLoading ? (
            <LoadingOutlined />
          ) : (
            <ControlOutlined />
          )
        }
        onClick={openModelAdvanceSettingBar}
        style={{
          insetInlineEnd: 40,
          bottom: floatButtonBaseYPosition + 55,
        }}
      />
      <Drawer
        title='Model Advance Settings'
        placement='left'
        closable={true}
        onClose={() => setIsOpen(false)}
        open={isOpen}
      >
        {(
          Object.entries(
            newAdvanceSettings,
          ) as Entries<ConversationModelAdvanceSettings>
        ).map(([key, value]) => (
          <React.Fragment key={key}>
            <ModelAdvanceSettingFormItem
              settingName={key}
              value={value}
              handleInputChange={handleInputChange}
              clearField={clearField}
              handleMoreInfoToggle={handleMoreInfoToggle}
            />
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
                {MODEL_ADVANCE_SETTINGS[key].description}{' '}
                {MODEL_ADVANCE_SETTINGS[key].link && (
                  <Typography.Link
                    href={MODEL_ADVANCE_SETTINGS[key].link}
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
          onClick={() => setIsOpen(false)}
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
