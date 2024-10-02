import React, { useContext, useState } from 'react';
import {
  Drawer,
  Form,
  Select,
  Button,
  Divider,
  Typography,
  Tooltip,
  Space,
  Alert,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type {
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../../../../types';
import { MODEL_SERVICE_CONSTANTS, PROJECT_LINK } from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';
import { GptSoVitsSettingsBar } from './VoiceSettingsBar/GptSoVitsSettingsBar';
import { QuestionCircleFilled } from '@ant-design/icons';
import type { AppDispatch, RootState } from '../../../redux';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';

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

  const dispatch = useDispatch<AppDispatch>();

  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings,
  );

  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const handleServiceChange = (
    field:
      | 'selectedTextToVoiceService'
      | 'selectedVoiceToTextService'
      | 'gptSoVitsSelectedReferenceVoice'
      | 'openaiSelectedVoice',
    value: (typeof settings)[keyof typeof settings],
  ) => {
    if (!value || isLoading) return;

    dispatch(updateAndSaveSetting({ key: field, value }));

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
          <Divider orientation={'left'} orientationMargin={0}>
            <Typography.Text type='secondary'>
              Voice Services Configuration
            </Typography.Text>
          </Divider>
          <Form.Item label='Text To Voice Service'>
            <Select
              value={settings.selectedTextToVoiceService}
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
                {settings.selectedVoiceToTextService !== 'not set' && (
                  <Tooltip title='Click to show more information'>
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
              value={settings.selectedVoiceToTextService}
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
            settings.selectedVoiceToTextService ===
              'visualStudioCodeBuiltIn' && (
              <Alert
                type={'info'}
                showIcon={true}
                closable={true}
                onClose={(_) => setTimeout(() => setShowMoreInfo(false), 500)}
                description={
                  <Typography.Text type={'secondary'}>
                    {
                      MODEL_SERVICE_CONSTANTS.visualStudioCodeBuiltIn
                        .description
                    }{' '}
                    This relies on the built-in voice to text service in VSCode.
                    If you have not installed it, you can do so by{' '}
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
                }
              />
            )}
          {showMoreInfo &&
            ['groq', 'openai'].includes(
              settings.selectedVoiceToTextService ?? '',
            ) && (
              <Alert
                type={'info'}
                showIcon={true}
                closable={true}
                onClose={(_) => setTimeout(() => setShowMoreInfo(false), 500)}
                description={
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
                    on Linux. This is required as we use shell for recording
                    audio. (If you have a better way, please suggest on{' '}
                    <Typography.Link
                      type={'warning'}
                      onClick={() => openLink(PROJECT_LINK.issues)}
                    >
                      GitHub
                    </Typography.Link>
                    .
                  </Typography.Text>
                }
              />
            )}
          <Divider orientation={'left'} orientationMargin={0}>
            <Typography.Text type='secondary'>
              OpenAI Voice Configuration
            </Typography.Text>
          </Divider>
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
              value={settings.openaiSelectedVoice}
              onChange={(value) =>
                handleServiceChange('openaiSelectedVoice', value)
              }
              placeholder='Select a voice'
              options={settings.openaiAvailableVoices?.map((voice, index) => {
                return {
                  key: `openaiVoice-${index}`,
                  label: voice.charAt(0).toUpperCase() + voice.slice(1),
                  value: voice,
                };
              })}
            />
          </Form.Item>
          <Divider orientation={'left'} orientationMargin={0}>
            <Typography.Text type='secondary'>
              GPT-SoVits Voice Configuration
            </Typography.Text>
          </Divider>
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
              value={settings.gptSoVitsSelectedReferenceVoice}
              onChange={(value) =>
                handleServiceChange('gptSoVitsSelectedReferenceVoice', value)
              }
              placeholder='Select a reference voice'
              options={settings.gptSoVitsAvailableReferenceVoices?.map(
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
          <Button
            type='primary'
            ghost
            onClick={onClose}
            style={{ marginTop: 20, width: '100%' }}
          >
            Close and Save
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
