import React, { useContext, useEffect, useState } from 'react';
import { Drawer, Form, Select, Button, Divider } from 'antd';

import type { ExtensionSettings, VoiceServiceType } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { GptSoVitsSettingsBar } from './VoiceSettingsBar/GptSoVitsSettingsBar';

const { Option } = Select;

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

  const textToVoiceServices: VoiceServiceType[] = ['not set', 'gptSoVits'];
  const voiceToTextServices: VoiceServiceType[] = ['not set'];
  const [partialSettings, setPartialSettings] = useState<
    Partial<ExtensionSettings>
  >({
    selectedTextToVoiceService: 'not set',
    selectedVoiceToTextService: 'not set',
    selectedGptSoVitsReferenceVoice: '',
    gptSoVitsAvailableReferenceVoices: [],
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
      | 'selectedGptSoVitsReferenceVoice',
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

    if (field !== 'selectedGptSoVitsReferenceVoice') return;

    callApi('switchGptSoVitsReferenceVoice', value as string).catch((e) =>
      callApi(
        'alertMessage',
        `Failed to switch reference voice: ${e.message}`,
        'error',
      ).catch(console.error),
    );
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
            >
              {textToVoiceServices.map((service) => (
                <Option key={service} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label='Voice To Text Service'>
            <Select
              value={partialSettings.selectedVoiceToTextService}
              onChange={(value) =>
                handleServiceChange('selectedVoiceToTextService', value)
              }
            >
              {voiceToTextServices.map((service) => (
                <Option key={service} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Divider />
          <Form.Item label='GptSoVits Reference Voice'>
            <Select
              value={partialSettings.selectedGptSoVitsReferenceVoice}
              onChange={(value) =>
                handleServiceChange('selectedGptSoVitsReferenceVoice', value)
              }
              placeholder='Select a reference voice'
            >
              {partialSettings.gptSoVitsAvailableReferenceVoices?.map(
                (voice) => (
                  <Option key={voice.name} value={voice.name}>
                    {voice.name}
                  </Option>
                ),
              )}
            </Select>
          </Form.Item>
          <Button
            type='primary'
            onClick={() => setIsGptSoVitsSettingsOpen(true)}
            ghost={true}
            block
          >
            GptSoVits Settings
          </Button>
        </Form>
      </Drawer>
      <GptSoVitsSettingsBar
        isOpen={isGptSoVitsSettingsOpen}
        onClose={() => setIsGptSoVitsSettingsOpen(false)}
      />
    </>
  );
};
