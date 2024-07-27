import React, { useContext, useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Select,
  Button,
  Divider,
  Typography,
  Tooltip,
  Space,
} from 'antd';

import type {
  ExtensionSettings,
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../../../../types';
import { MODEL_SERVICE_LINKS } from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';
import { GptSoVitsSettingsBar } from './VoiceSettingsBar/GptSoVitsSettingsBar';

interface VoiceSettingsBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsBar: React.FC<VoiceSettingsBarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [isGptSoVitsSettingsOpen, setIsGptSoVitsSettingsOpen] = useState(false);

  const textToVoiceServices: TextToVoiceServiceType[] = [
    'not set',
    'openai',
    'gptSoVits',
  ];
  const voiceToTextServices: VoiceToTextServiceType[] = [
    'not set',
    'groq',
    'openai',
    'visualStudioCodeBuiltIn',
  ];
  const [partialSettings, setPartialSettings] = useState<
    Partial<ExtensionSettings>
  >({
    selectedTextToVoiceService: 'not set',
    selectedVoiceToTextService: 'not set',
    gptSoVitsSelectedReferenceVoice: '',
    gptSoVitsAvailableReferenceVoices: [],
    openaiAvailableVoices: [],
    openaiSelectedVoice: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      // Create an array of promises for the API calls
      const promises = Object.keys(partialSettings).map(async (key) => {
        try {
          let value = await callApi(
            'getSetting',
            key as keyof typeof partialSettings,
          );
          setPartialSettings((prev) => ({ ...prev, [key]: value }));
        } catch (e) {
          console.error(`Failed to fetch setting ${key}:`, e);
        }
      });

      // Use Promise.all to wait for all API calls to complete
      Promise.all(promises).then(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleServiceChange = (
    field:
      | 'selectedTextToVoiceService'
      | 'selectedVoiceToTextService'
      | 'gptSoVitsSelectedReferenceVoice'
      | 'openaiSelectedVoice',
    value: (typeof partialSettings)[keyof typeof partialSettings],
  ) => {
    if (!value || isLoading) return;

    const originalValue = partialSettings[field];

    setPartialSettings({
      ...partialSettings,
      [field]: value,
    });

    callApi('setSetting', field, value).catch((e) => {
      callApi(
        'alertMessage',
        `Failed to save settings: ${e.message}`,
        'error',
      ).catch(console.error);
      setPartialSettings({
        ...partialSettings,
        [field]: originalValue,
      });
    });

    if (field !== 'gptSoVitsSelectedReferenceVoice') return;

    callApi('switchGptSoVitsReferenceVoice', value as string).catch((e) =>
      callApi(
        'alertMessage',
        `Failed to switch reference voice: ${e.message}`,
        'error',
      ).catch(console.error),
    );
  };

  const openModelServiceLink = (
    settingKey: keyof Partial<ExtensionSettings>,
  ) => {
    const link = MODEL_SERVICE_LINKS[settingKey];
    if (link) {
      callApi('openExternalLink', link)
        .then(() => {})
        .catch(console.error);
    }
  };

  const handleEditGptSoVitsSettingsSave = (
    newSettings: Partial<ExtensionSettings>,
  ) => {
    setPartialSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  return (
    <>
      <Drawer
        title='Voice Settings'
        placement='left'
        open={isOpen}
        onClose={onClose}
        width={400}
        loading={isLoading}
      >
        <Form layout='vertical'>
          <Form.Item label='Text To Voice Service'>
            <Select
              value={partialSettings.selectedTextToVoiceService}
              onChange={(value) =>
                handleServiceChange('selectedTextToVoiceService', value)
              }
              options={textToVoiceServices.map((service) => {
                return {
                  key: service,
                  label: service.charAt(0).toUpperCase() + service.slice(1),
                  value: service,
                };
              })}
            />
          </Form.Item>
          <Form.Item label='Voice To Text Service'>
            <Select
              value={partialSettings.selectedVoiceToTextService}
              onChange={(value) =>
                handleServiceChange('selectedVoiceToTextService', value)
              }
              options={voiceToTextServices.map((service) => {
                return {
                  key: service,
                  label: service.charAt(0).toUpperCase() + service.slice(1),
                  value: service,
                };
              })}
            />
          </Form.Item>
          <Divider />
          <Form.Item
            label={
              <Space>
                <span>
                  Voice{' '}
                  <Typography.Text type={'secondary'}>(OpenAI)</Typography.Text>
                </span>
                <Tooltip title='Preview voices at OpenAI website'>
                  <Typography.Link
                    type={'secondary'}
                    onClick={() =>
                      openModelServiceLink(
                        'openaiAvailableVoices' as keyof ExtensionSettings,
                      )
                    }
                  >
                    Learn more
                  </Typography.Link>
                </Tooltip>
              </Space>
            }
          >
            <Select
              value={partialSettings.openaiSelectedVoice}
              onChange={(value) =>
                handleServiceChange('openaiSelectedVoice', value)
              }
              placeholder='Select a voice'
              options={partialSettings.openaiAvailableVoices?.map(
                (voice, index) => {
                  return {
                    key: `openaiVoice-${index}`,
                    label: voice,
                    value: voice,
                  };
                },
              )}
            />
          </Form.Item>
          <Divider />
          <Form.Item
            label={
              <Space>
                <span>
                  Voice{' '}
                  <Typography.Text type={'secondary'}>
                    (GPT-SoVits)
                  </Typography.Text>
                </span>
                <Tooltip title='Find out more about set up GPT-SoVits client host'>
                  <Typography.Link
                    type={'secondary'}
                    onClick={() =>
                      openModelServiceLink(
                        'gptSoVitsClientHost' as keyof ExtensionSettings,
                      )
                    }
                  >
                    Learn more
                  </Typography.Link>
                </Tooltip>
              </Space>
            }
          >
            <Select
              value={partialSettings.gptSoVitsSelectedReferenceVoice}
              onChange={(value) =>
                handleServiceChange('gptSoVitsSelectedReferenceVoice', value)
              }
              placeholder='Select a reference voice'
              options={partialSettings.gptSoVitsAvailableReferenceVoices?.map(
                (voice, index) => {
                  return {
                    key: `gptSoVitsVoice-${index}`,
                    label: voice.name,
                    value: voice.name,
                  };
                },
              )}
            />
          </Form.Item>
          <Button
            type='primary'
            onClick={() => setIsGptSoVitsSettingsOpen(true)}
            ghost={true}
            block
          >
            Advance Settings
          </Button>
        </Form>
      </Drawer>
      <GptSoVitsSettingsBar
        isOpen={isGptSoVitsSettingsOpen}
        onClose={() => setIsGptSoVitsSettingsOpen(false)}
        handleEditGptSoVitsSettingsSave={handleEditGptSoVitsSettingsSave}
      />
    </>
  );
};
