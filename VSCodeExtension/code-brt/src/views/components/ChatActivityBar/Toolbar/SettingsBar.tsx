import React, { useContext } from 'react';
import styled from 'styled-components';
import type { AggregationColor } from 'antd/es/color-picker/color';
import type { CheckboxProps } from 'antd/es/checkbox';
import {
  Drawer,
  Form,
  Input,
  Select,
  ColorPicker,
  Button,
  Space,
  Tooltip,
  Typography,
  Checkbox,
  Divider,
  Alert,
  Tag,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type {
  ExtensionSettings,
  ModelServiceType,
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../../../../types';
import {
  DEFAULT_CROSS_DEVICE_SETTINGS,
  MODEL_SERVICE_CONSTANTS,
} from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';
import type { AppDispatch, RootState } from '../../../redux';
import {
  saveSettings,
  updateAndSaveSetting,
  updateLocalSetting,
} from '../../../redux/slices/settingsSlice';
import { QuestionCircleOutlined } from '@ant-design/icons';

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

const PAID_PLAN_ONLY = ['anthropic', 'openai', 'moonshot', 'deepseek'];
const SUPPORTED_OFFLINE = ['ollama', 'gptSoVits'];

// Define the desired order of settings
const SETTINGS_GROUPS: {
  titleKey: string;
  title: string;
  keys: (keyof ExtensionSettings)[];
}[] = [
  {
    title: 'API Key Settings',
    titleKey: 'apiKeySettings',
    keys: [
      'anthropicApiKey',
      'openaiApiKey',
      'deepseekApiKey',
      'moonshotApiKey',
      'geminiApiKey',
      'cohereApiKey',
      'groqApiKey',
      'huggingFaceApiKey',
      'openRouterApiKey',
    ],
  },
  {
    title: 'Host Server Settings',
    titleKey: 'hostServerSettings',
    keys: ['ollamaClientHost', 'gptSoVitsClientHost'],
  },
  {
    title: 'Theme and Customize',
    titleKey: 'themeAndCustomize',
    keys: ['themePrimaryColor', 'themeAlgorithm', 'themeBorderRadius'],
  },
  {
    title: 'Other Settings',
    titleKey: 'otherSettings',
    keys: ['language', 'doubleEnterSendMessages', 'retainContextWhenHidden'],
  },
];

type SettingSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  setTheme: (newTheme: {
    primaryColor?: ExtensionSettings['themePrimaryColor'];
    algorithm?: ExtensionSettings['themeAlgorithm'];
    borderRadius?: ExtensionSettings['themeBorderRadius'];
  }) => Promise<void>;
};

export const SettingsBar: React.FC<SettingSidebarProps> = ({
  isOpen,
  onClose,
  setTheme,
}) => {
  const { t, i18n } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);

  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings, needsReload } = useSelector(
    (state: RootState) => state.settings,
  );

  // Save settings whenever the sidebar is closed
  const handleCloseAndSave = () => {
    if (isLoading) {
      onClose();
      return;
    }

    dispatch(saveSettings(settings));
    onClose();
  };

  // Handle changes to settings that don't require immediate effect
  const handleSettingChange =
    (key: keyof ExtensionSettings) => (event: any) => {
      const value = event.target.value;
      dispatch(updateLocalSetting({ key, value }));
    };

  // Immediate application of display style changes
  const handleColorChange = (color: AggregationColor) => {
    const newColor = color.toHexString();
    setTheme({ primaryColor: newColor }).then(() => {
      dispatch(
        updateLocalSetting({ key: 'themePrimaryColor', value: newColor }),
      );
    });
  };

  const handleAlgorithmChange = (
    value: ExtensionSettings['themeAlgorithm'],
  ) => {
    setTheme({ algorithm: value }).then(() => {
      dispatch(updateLocalSetting({ key: 'themeAlgorithm', value }));
    });
  };

  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value);
    setTheme({ borderRadius: value }).then(() => {
      dispatch(updateLocalSetting({ key: 'themeBorderRadius', value }));
    });
  };

  const resetTheme = () => {
    const defaultTheme = {
      primaryColor: DEFAULT_CROSS_DEVICE_SETTINGS.themePrimaryColor,
      algorithm: DEFAULT_CROSS_DEVICE_SETTINGS.themeAlgorithm,
      borderRadius: DEFAULT_CROSS_DEVICE_SETTINGS.themeBorderRadius,
    };
    setTheme(defaultTheme).then(() => {
      dispatch(
        updateLocalSetting({
          key: 'themePrimaryColor',
          value: defaultTheme.primaryColor,
        }),
      );
      dispatch(
        updateLocalSetting({
          key: 'themeAlgorithm',
          value: defaultTheme.algorithm,
        }),
      );
      dispatch(
        updateLocalSetting({
          key: 'themeBorderRadius',
          value: defaultTheme.borderRadius,
        }),
      );
    });
  };

  const handleCheckboxChange =
    (key: keyof ExtensionSettings): CheckboxProps['onChange'] =>
    (e) => {
      const value = e.target.checked;
      dispatch(updateLocalSetting({ key, value }));
    };

  const openModelServiceLink = (link: string) => {
    callApi('openExternalLink', link)
      .then(() => {})
      .catch(console.error);
  };

  return (
    <Drawer
      title={t('toolBar.generalSettings')}
      open={isOpen}
      onClose={handleCloseAndSave}
      placement='left'
      width={400}
      loading={isLoading}
      extra={
        <Button
          type={'text'}
          href={
            'https://whats2000.github.io/CodeBRT/docs/getting-started/configuration'
          }
          target='_blank'
          icon={<QuestionCircleOutlined />}
          iconPosition={'end'}
        >
          <Typography.Text type='secondary'>{t('learnMore')}</Typography.Text>
        </Button>
      }
    >
      {needsReload && (
        <Alert
          message={t('settingsBar.settingsReloadRequired')}
          type='warning'
          showIcon
          style={{ marginBottom: 10 }}
        />
      )}
      <StyledForm layout='vertical'>
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title}>
            <Divider orientation='left' orientationMargin={0}>
              <Typography.Text type='secondary'>
                {t(`settingsBar.${group.titleKey}`)}
              </Typography.Text>
            </Divider>
            {group.keys.map((key) => {
              const value = settings[key];

              // Render the form controls based on the key
              if (key === 'themePrimaryColor') {
                return (
                  <FormGroup
                    key={key}
                    label={t('settingsBar.themePrimaryColor')}
                  >
                    <ColorPicker
                      format='hex'
                      defaultValue={value}
                      onChangeComplete={handleColorChange}
                      showText={(color) => color.toHexString()}
                    />
                  </FormGroup>
                );
              } else if (key === 'themeAlgorithm') {
                return (
                  <FormGroup key={key} label={t('settingsBar.themeAlgorithm')}>
                    <Select
                      mode='multiple'
                      value={
                        value as
                          | 'darkAlgorithm'
                          | 'defaultAlgorithm'
                          | 'compactAlgorithm'
                      }
                      onChange={handleAlgorithmChange}
                      options={[
                        {
                          key: 'defaultAlgorithm',
                          value: 'defaultAlgorithm',
                          label: t('settingsBar.lightTheme'),
                        },
                        {
                          key: 'darkAlgorithm',
                          value: 'darkAlgorithm',
                          label: t('settingsBar.darkTheme'),
                        },
                        {
                          key: 'compactAlgorithm',
                          value: 'compactAlgorithm',
                          label: t('settingsBar.compactTheme'),
                        },
                      ]}
                    />
                  </FormGroup>
                );
              } else if (key === 'themeBorderRadius') {
                return (
                  <FormGroup
                    key={key}
                    label={t('settingsBar.themeBorderRadius')}
                  >
                    <Input
                      type='number'
                      value={value}
                      onChange={handleBorderRadiusChange}
                    />
                  </FormGroup>
                );
              } else if (
                key === 'doubleEnterSendMessages' ||
                key === 'retainContextWhenHidden'
              ) {
                const label =
                  key === 'doubleEnterSendMessages'
                    ? t('settingsBar.doubleEnterSendMessagesLabel')
                    : t('settingsBar.keepLoadedContextLabel');
                const description =
                  key === 'doubleEnterSendMessages'
                    ? t('settingsBar.doubleEnterSendMessagesDescription')
                    : t('settingsBar.keepLoadedContextDescription');

                return (
                  <FormGroup key={key} label={label}>
                    <Checkbox
                      checked={value}
                      onChange={handleCheckboxChange(key)}
                    >
                      <Typography.Text type='secondary'>
                        {description}
                      </Typography.Text>
                    </Checkbox>
                  </FormGroup>
                );
              } else if (key.includes('ApiKey') || key.includes('ClientHost')) {
                const serviceKey = key
                  .replace('ApiKey', '')
                  .replace('ClientHost', '') as Exclude<
                  | ModelServiceType
                  | TextToVoiceServiceType
                  | VoiceToTextServiceType,
                  'not set'
                >;
                return (
                  <FormGroup
                    key={key}
                    label={
                      <Space wrap={true}>
                        <span>
                          {MODEL_SERVICE_CONSTANTS[serviceKey]?.name || key}
                        </span>
                        {MODEL_SERVICE_CONSTANTS[serviceKey]?.apiLink && (
                          <Tooltip
                            title={
                              key.includes('ApiKey')
                                ? t('settingsBar.apiKeyLinkTooltip')
                                : t('settingsBar.downloadLinkTooltip')
                            }
                          >
                            <Typography.Link
                              type='secondary'
                              underline={true}
                              onClick={() =>
                                openModelServiceLink(
                                  MODEL_SERVICE_CONSTANTS[serviceKey].apiLink,
                                )
                              }
                            >
                              {key.includes('ApiKey')
                                ? t('settingsBar.getApiKey')
                                : t('learnMore')}
                            </Typography.Link>
                          </Tooltip>
                        )}
                        {!PAID_PLAN_ONLY.includes(serviceKey) && (
                          <Tag color='blue' style={{ margin: 0 }}>
                            {t('settingsBar.free')}
                          </Tag>
                        )}
                        {SUPPORTED_OFFLINE.includes(serviceKey) && (
                          <Tag color='green' style={{ margin: 0 }}>
                            {t('settingsBar.supportsOffline')}
                          </Tag>
                        )}
                      </Space>
                    }
                  >
                    <Input.Password
                      value={(value as string) || ''}
                      onChange={handleSettingChange(key)}
                    />
                  </FormGroup>
                );
              } else if (key === 'language') {
                return (
                  <FormGroup key={key} label={'Language'}>
                    <Select
                      value={value as string}
                      onSelect={(value) => {
                        void i18n.changeLanguage(value);
                        dispatch(updateAndSaveSetting({ key, value }));
                      }}
                      options={[
                        { key: 'en-US', value: 'en-US', label: 'English' },
                        { key: 'zh-TW', value: 'zh-TW', label: '繁體中文' },
                        { key: 'zh-CN', value: 'zh-CN', label: '简体中文' },
                      ]}
                    />
                  </FormGroup>
                );
              } else {
                // Default rendering for other settings
                return (
                  <FormGroup key={key} label={key}>
                    <Input
                      value={(value as string) || ''}
                      onChange={handleSettingChange(key)}
                    />
                  </FormGroup>
                );
              }
            })}
          </div>
        ))}
      </StyledForm>
      <Button
        type='primary'
        danger={true}
        ghost={true}
        onClick={resetTheme}
        style={{ width: '100%' }}
      >
        {t('settingsBar.resetTheme')}
      </Button>
      <Button onClick={handleCloseAndSave} style={{ marginTop: 20 }} block>
        {t('closeAndSave')}
      </Button>
    </Drawer>
  );
};
