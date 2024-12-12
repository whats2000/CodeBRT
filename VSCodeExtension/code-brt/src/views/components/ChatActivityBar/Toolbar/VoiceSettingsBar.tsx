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
import { Trans, useTranslation } from 'react-i18next';

import type {
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../../../../types';
import { MODEL_SERVICE_CONSTANTS, PROJECT_LINK } from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';
import { GptSoVitsSettingsBar } from './VoiceSettingsBar/GptSoVitsSettingsBar';
import {
  QuestionCircleFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons';
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
  const { t } = useTranslation('common');
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
        title={t('voiceSettingsBar.title')}
        placement='left'
        open={isOpen}
        onClose={onClose}
        width={400}
        loading={isLoading}
        extra={
          <Button
            type={'text'}
            href={
              'https://whats2000.github.io/CodeBRT/docs/features/voice-service/installation'
            }
            target={'_blank'}
            icon={<QuestionCircleOutlined />}
            iconPosition={'end'}
          >
            <Typography.Text type='secondary'>{t('learnMore')}</Typography.Text>
          </Button>
        }
      >
        <Form layout='vertical'>
          <Divider orientation={'left'} orientationMargin={0}>
            <Typography.Text type='secondary'>
              {t('voiceSettingsBar.voiceServicesConfig')}
            </Typography.Text>
          </Divider>
          <Form.Item label={t('voiceSettingsBar.textToVoiceService')}>
            <Select
              value={settings.selectedTextToVoiceService}
              onChange={(value) =>
                handleServiceChange('selectedTextToVoiceService', value)
              }
              options={textToVoiceServices.map((service) => ({
                key: service,
                label:
                  service === 'not set'
                    ? t('notSet')
                    : MODEL_SERVICE_CONSTANTS[service].name,
                value: service,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={
              <Space>
                {t('voiceSettingsBar.voiceToTextService')}
                {settings.selectedVoiceToTextService !== 'not set' && (
                  <Tooltip title={t('voiceSettingsBar.clickToShowMoreInfo')}>
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
                    ? t('notSet')
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
                    <Trans
                      i18nKey={t(
                        'voiceSettingsBar.vscodeSpeechExtensionNotice',
                      )}
                      components={{
                        marketplace: (
                          <Typography.Link
                            type={'warning'}
                            onClick={() =>
                              callApi(
                                'openExtensionMarketplace',
                                'ms-vscode.vscode-speech',
                              )
                            }
                          >
                            {t('marketplace')}
                          </Typography.Link>
                        ),
                      }}
                    />
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
                    <Trans
                      i18nKey={'voiceSettingsBar.microphoneAccessNotice'}
                      components={{
                        sox: (
                          <Typography.Link
                            type={'warning'}
                            onClick={() =>
                              openLink('https://sourceforge.net/projects/sox/')
                            }
                          >
                            {t('voiceSettingsBar.sox')}
                          </Typography.Link>
                        ),
                        alsa: (
                          <Typography.Link
                            type={'warning'}
                            onClick={() =>
                              openLink(
                                'https://www.alsa-project.org/wiki/Download',
                              )
                            }
                          >
                            {t('voiceSettingsBar.alsa')}
                          </Typography.Link>
                        ),
                        github: (
                          <Typography.Link
                            type={'warning'}
                            onClick={() => openLink(PROJECT_LINK.issues)}
                          >
                            {t('github')}
                          </Typography.Link>
                        ),
                      }}
                    />
                  </Typography.Text>
                }
              />
            )}
          <Divider orientation={'left'} orientationMargin={0}>
            <Typography.Text type='secondary'>
              {t('voiceSettingsBar.openAIVoiceConfig')}
            </Typography.Text>
          </Divider>
          <Form.Item
            label={
              <Space>
                <span>
                  {t('voice')}{' '}
                  <Typography.Text type={'secondary'}>
                    {t('voiceSettingsBar.openAIVoiceLabel')}
                  </Typography.Text>
                </span>
                <Tooltip title={t('voiceSettingsBar.openAIPreviewVoices')}>
                  <Typography.Link
                    type={'secondary'}
                    underline={true}
                    onClick={() =>
                      openLink(MODEL_SERVICE_CONSTANTS.openai.apiLink)
                    }
                  >
                    {t('learnMore')}
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
              placeholder={t('voiceSettingsBar.selectVoice')}
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
              {t('voiceSettingsBar.gptSoVitsVoiceConfig')}
            </Typography.Text>
          </Divider>
          <Form.Item
            label={
              <Space>
                <span>
                  {t('voice')}{' '}
                  <Typography.Text type={'secondary'}>
                    {t('voiceSettingsBar.gptSoVitsVoiceLabel')}
                  </Typography.Text>
                </span>
                <Tooltip title={t('voiceSettingsBar.gptSoVitsLearnMore')}>
                  <Typography.Link
                    type={'secondary'}
                    underline={true}
                    onClick={() =>
                      openLink(MODEL_SERVICE_CONSTANTS.gptSoVits.apiLink)
                    }
                  >
                    {t('learnMore')}
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
              placeholder={t('voiceSettingsBar.selectReferenceVoice')}
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
          <Button onClick={() => setIsGptSoVitsSettingsOpen(true)} block>
            {t('voiceSettingsBar.gptSoVitsAdvanceSettings')}
          </Button>
          <Button onClick={onClose} style={{ marginTop: 20 }} block>
            {t('closeAndSave')}
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
