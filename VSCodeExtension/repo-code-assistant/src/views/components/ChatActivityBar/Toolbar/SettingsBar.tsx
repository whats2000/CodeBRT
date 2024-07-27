import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import type { Color } from 'antd/es/color-picker/color';
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
} from 'antd';

import type { ExtensionSettings } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { MODEL_SERVICE_LINKS } from '../../../../constants';

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

type SettingSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  setTheme: (newTheme: {
    primaryColor?: string | undefined;
    algorithm?:
      | 'defaultAlgorithm'
      | 'darkAlgorithm'
      | 'compactAlgorithm'
      | undefined;
    borderRadius?: number | undefined;
  }) => Promise<void>;
};

export const SettingsBar: React.FC<SettingSidebarProps> = ({
  isOpen,
  onClose,
  setTheme,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [partialSettings, setPartialSettings] = useState<
    Partial<ExtensionSettings>
  >({
    anthropicApiKey: '',
    groqApiKey: '',
    geminiApiKey: '',
    openaiApiKey: '',
    cohereApiKey: '',
    huggingFaceApiKey: '',
    ollamaClientHost: '',
    gptSoVitsClientHost: '',
    themePrimaryColor: '#1677ff',
    themeAlgorithm: 'defaultAlgorithm',
    themeBorderRadius: 4,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsLoading(true);
    const promises = Object.keys(partialSettings).map(async (key) => {
      try {
        const value = await callApi(
          'getSetting',
          key as keyof typeof partialSettings,
        );
        setPartialSettings((prev) => ({ ...prev, [key]: value }));
      } catch (e) {
        console.error(`Failed to fetch setting ${key}:`, e);
      }
    });
    Promise.all(promises).finally(() => {
      setIsLoading(false);
    });
  }, [isOpen]);

  const handleSettingChange =
    (key: keyof Partial<ExtensionSettings>) => (event: any) => {
      setPartialSettings((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleBlurSave = () => {
    saveSettings(partialSettings);
  };

  const handleColorChange = (color: Color) => {
    setPartialSettings((prev) => ({
      ...prev,
      themePrimaryColor: color.toHexString(),
    }));
    setTheme({ primaryColor: color.toHexString() }).then(() => {
      saveSettings({
        ...partialSettings,
        themePrimaryColor: color.toHexString(),
      });
    });
  };

  const handleAlgorithmChange = (
    value: 'darkAlgorithm' | 'defaultAlgorithm' | 'compactAlgorithm',
  ) => {
    setPartialSettings((prev) => ({ ...prev, themeAlgorithm: value }));
    setTheme({ algorithm: value }).then(() => {
      saveSettings({ ...partialSettings, themeAlgorithm: value });
    });
  };

  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value);
    setPartialSettings((prev) => ({ ...prev, themeBorderRadius: value }));
    setTheme({ borderRadius: value }).then(() => {
      saveSettings({ ...partialSettings, themeBorderRadius: value });
    });
  };

  const resetTheme = () => {
    setPartialSettings((prev) => ({
      ...prev,
      themePrimaryColor: '#f1f1f1',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    }));
    saveSettings({
      ...partialSettings,
      themePrimaryColor: '#f1f1f1',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    });
  };

  const saveSettings = (updatedSettings: Partial<ExtensionSettings>) => {
    Object.entries(updatedSettings).map(([key, value]) =>
      callApi('setSetting', key as keyof ExtensionSettings, value).catch((e) =>
        callApi(
          'alertMessage',
          `Failed to save settings: ${e.message}`,
          'error',
        ),
      ),
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

  return (
    <Drawer
      title='Settings Bar'
      open={isOpen}
      onClose={onClose}
      placement='left'
      width={400}
      loading={isLoading}
    >
      <StyledForm
        layout='vertical'
        onFinish={() => saveSettings(partialSettings)}
      >
        {Object.entries(partialSettings).map(([key, value]) => {
          if (key.includes('ApiKey') || key.includes('ClientHost')) {
            return (
              <FormGroup
                key={key}
                label={
                  <Space>
                    <span>
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    <Tooltip title='Find out more about API keys and client hosts'>
                      <Typography.Link
                        type={'secondary'}
                        onClick={() =>
                          openModelServiceLink(key as keyof ExtensionSettings)
                        }
                      >
                        Learn more
                      </Typography.Link>
                    </Tooltip>
                  </Space>
                }
              >
                <Input.Password
                  value={(value as string) || ''}
                  onChange={handleSettingChange(
                    key as keyof typeof partialSettings,
                  )}
                  onBlur={handleBlurSave}
                />
              </FormGroup>
            );
          } else if (key === 'themePrimaryColor') {
            return (
              <FormGroup
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')
                }
              >
                <ColorPicker
                  format='hex'
                  value={value as string}
                  onChangeComplete={handleColorChange}
                  showText={(color) => color.toHexString()}
                />
              </FormGroup>
            );
          } else if (key === 'themeAlgorithm') {
            return (
              <FormGroup
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')
                }
              >
                <Select
                  value={
                    value as
                      | 'darkAlgorithm'
                      | 'defaultAlgorithm'
                      | 'compactAlgorithm'
                  }
                  onChange={handleAlgorithmChange}
                >
                  <Select.Option value='defaultAlgorithm'>Light</Select.Option>
                  <Select.Option value='darkAlgorithm'>Dark</Select.Option>
                  <Select.Option value='compactAlgorithm'>
                    Compact
                  </Select.Option>
                </Select>
              </FormGroup>
            );
          } else if (key === 'themeBorderRadius') {
            return (
              <FormGroup
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')
                }
              >
                <Input
                  type='number'
                  value={value as number}
                  onChange={handleBorderRadiusChange}
                  onBlur={handleBlurSave}
                />
              </FormGroup>
            );
          }
        })}
      </StyledForm>
      <Button
        type='primary'
        ghost={true}
        onClick={resetTheme}
        style={{ width: '100%' }}
      >
        Reset Theme
      </Button>
    </Drawer>
  );
};
