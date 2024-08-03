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
import { MODEL_SERVICE_CONSTANTS, PROJECT_LINK } from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';
import { GptSoVitsSettingsBar } from './VoiceSettingsBar/GptSoVitsSettingsBar';
import { QuestionCircleFilled } from '@ant-design/icons';

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
  const [showMoreInfo, setShowMoreInfo] = useState(false);
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

  const openLink = (link: string) => {
    callApi('openExternalLink', link).catch(console.error);
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
              options={textToVoiceServices.map((service) => ({
                key: service,
                label:
                  service === 'not set'
                    ? 'Not Set'
                    : MODEL_SERVICE_CONSTANTS[service].name,
                value: service,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={
              <Space>
                Voice To Text Service
                {partialSettings.selectedVoiceToTextService !== 'not set' && (
                  <Tooltip title='Click to learn more'>
                    <Typography.Link
                      type={'secondary'}
                      onClick={() => setShowMoreInfo(!showMoreInfo)}
                    >
                      <QuestionCircleFilled />
                    </Typography.Link>
                  </Tooltip>
                )}
              </Space>
            }
          >
            <Select
              value={partialSettings.selectedVoiceToTextService}
              onChange={(value) =>
                handleServiceChange('selectedVoiceToTextService', value)
              }
              options={voiceToTextServices.map((service) => ({
                key: service,
                label:
                  service === 'not set'
                    ? 'Not Set'
                    : MODEL_SERVICE_CONSTANTS[service].name,
                value: service,
              }))}
            />
          </Form.Item>
          {/* Additional Information */}
          {showMoreInfo &&
            partialSettings.selectedVoiceToTextService ===
              'visualStudioCodeBuiltIn' && (
              <Typography.Text type={'secondary'}>
                {MODEL_SERVICE_CONSTANTS.visualStudioCodeBuiltIn.description}{' '}
                This relies on the built-in voice to text service in VSCode. If
                you have not installed it, you can do so by{' '}
                <Typography.Link
                  type={'warning'}
                  onClick={() =>
                    callApi(
                      'openExtensionMarketplace',
                      'ms-vscode.vscode-speech',
                    )
                  }
                >
                  marketplace
                </Typography.Link>
                .
              </Typography.Text>
            )}
          {showMoreInfo &&
            ['groq', 'openai'].includes(
              partialSettings.selectedVoiceToTextService ?? '',
            ) && (
              <Typography.Text type={'secondary'}>
                Notice: This will require microphone access with{' '}
                <Typography.Link
                  type={'warning'}
                  onClick={() =>
                    openLink('https://sourceforge.net/projects/sox/')
                  }
                >
                  SoX
                </Typography.Link>{' '}
                installed on Windows/Mac or{' '}
                <Typography.Link
                  type={'warning'}
                  onClick={() =>
                    openLink('https://www.alsa-project.org/wiki/Download')
                  }
                >
                  ALSA
                </Typography.Link>{' '}
                on Linux. This is required as we use shell for recording audio.
                (If you have a better way, please suggest on{' '}
                <Typography.Link
                  type={'warning'}
                  onClick={() => openLink(PROJECT_LINK.issues)}
                >
                  GitHub
                </Typography.Link>
                .
              </Typography.Text>
            )}
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
                      openLink(MODEL_SERVICE_CONSTANTS.openai.apiLink)
                    }
                  >
                    Learn More
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
                    label: voice.charAt(0).toUpperCase() + voice.slice(1),
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
                      openLink(MODEL_SERVICE_CONSTANTS.gptSoVits.apiLink)
                    }
                  >
                    Learn More
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
            GPT-SoVits Advance Settings
          </Button>
          <Divider />
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
