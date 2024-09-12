import type { Entries } from 'type-fest';

import React, { useState, useEffect, useContext } from 'react';
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
} from 'antd';

import type {
  ExtensionSettings,
  ModelServiceType,
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../../../../types';
import { MODEL_SERVICE_CONSTANTS } from '../../../../constants';
import { WebviewContext } from '../../../WebviewContext';

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
    doubleEnterSendMessages: false,
    retainContextWhenHidden: false,
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

  const handleBlurSave = (key: keyof Partial<ExtensionSettings>) => {
    saveSettings({ [key]: partialSettings[key] });
  };

  const handleColorChange = (color: AggregationColor) => {
    setPartialSettings((prev) => ({
      ...prev,
      themePrimaryColor: color.toHexString(),
    }));
    setTheme({ primaryColor: color.toHexString() }).then(() => {
      saveSettings({
        themePrimaryColor: color.toHexString(),
      });
    });
  };

  const handleAlgorithmChange = (
    value: 'darkAlgorithm' | 'defaultAlgorithm' | 'compactAlgorithm',
  ) => {
    setPartialSettings((prev) => ({ ...prev, themeAlgorithm: value }));
    setTheme({ algorithm: value }).then(() => {
      saveSettings({ themeAlgorithm: value });
    });
  };

  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value);
    setPartialSettings((prev) => ({ ...prev, themeBorderRadius: value }));
    setTheme({ borderRadius: value }).then(() => {
      saveSettings({ themeBorderRadius: value });
    });
  };

  const resetTheme = () => {
    setPartialSettings((prev) => ({
      ...prev,
      themePrimaryColor: '#f1f1f1',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    }));
    setTheme({
      primaryColor: '#f1f1f1',
      algorithm: 'darkAlgorithm',
      borderRadius: 4,
    }).then(() => {
      saveSettings({
        themePrimaryColor: '#f1f1f1',
        themeAlgorithm: 'darkAlgorithm',
        themeBorderRadius: 4,
      });
    });
  };

  const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
    setPartialSettings((prev) => ({
      ...prev,
      retainContextWhenHidden: e.target.checked,
    }));
    saveSettings({ retainContextWhenHidden: e.target.checked });
  };

  const handleDoubleEnterChange: CheckboxProps['onChange'] = (e) => {
    setPartialSettings((prev) => ({
      ...prev,
      doubleEnterSendMessages: e.target.checked,
    }));
    saveSettings({ doubleEnterSendMessages: e.target.checked });
  };

  const saveSettings = (updatedSettings: Partial<ExtensionSettings>) => {
    Object.entries(updatedSettings).map(([key, value]) => {
      callApi(
        'setSetting',
        key as keyof ExtensionSettings,
        value,
        key === 'retainContextWhenHidden',
      ).catch((e) =>
        callApi(
          'alertMessage',
          `Failed to save settings: ${e.message}`,
          'error',
        ),
      );
    });
  };

  const openModelServiceLink = (link: string) => {
    callApi('openExternalLink', link)
      .then(() => {})
      .catch(console.error);
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
        {(
          Object.entries(partialSettings) as Entries<Partial<ExtensionSettings>>
        ).map(([key, value]) => {
          if (key.includes('ApiKey') || key.includes('ClientHost')) {
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
                  <Space>
                    <span>{MODEL_SERVICE_CONSTANTS[serviceKey].name}</span>
                    <Tooltip title='Find out more about API keys and client hosts'>
                      <Typography.Link
                        type={'secondary'}
                        onClick={() =>
                          openModelServiceLink(
                            MODEL_SERVICE_CONSTANTS[serviceKey].apiLink,
                          )
                        }
                      >
                        Get API Key
                      </Typography.Link>
                    </Tooltip>
                  </Space>
                }
              >
                <Input.Password
                  value={(value as string) || ''}
                  onChange={handleSettingChange(key)}
                  onBlur={() => handleBlurSave(key)}
                />
              </FormGroup>
            );
          } else if (key === 'themePrimaryColor') {
            return (
              <FormGroup key={key} label={'Theme Primary Color'}>
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
              <FormGroup key={key} label={'Theme Algorithm'}>
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
              <FormGroup key={key} label={'Theme Border Radius'}>
                <Input
                  type='number'
                  value={value}
                  onChange={handleBorderRadiusChange}
                  onBlur={() => handleBlurSave(key)}
                />
              </FormGroup>
            );
          } else if (key === 'doubleEnterSendMessages') {
            return (
              <FormGroup key={key} label={'Send messages with double enter'}>
                <Checkbox checked={value} onChange={handleDoubleEnterChange}>
                  <Typography.Text color={'secondary'}>
                    Send messages with double enter
                  </Typography.Text>
                </Checkbox>
              </FormGroup>
            );
          } else if (key === 'retainContextWhenHidden') {
            return (
              <FormGroup key={key} label={'Keep the loaded context'}>
                <Checkbox checked={value} onChange={handleCheckboxChange}>
                  <Typography.Text color={'secondary'}>
                    Cost more RAM but faster loading
                  </Typography.Text>
                </Checkbox>
              </FormGroup>
            );
          }
        })}
      </StyledForm>
      <Button
        type='primary'
        danger={true}
        ghost={true}
        onClick={resetTheme}
        style={{ width: '100%' }}
      >
        Reset Theme
      </Button>
      <Button
        type='primary'
        ghost
        onClick={onClose}
        style={{ marginTop: 20, width: '100%' }}
      >
        Close and Save
      </Button>
    </Drawer>
  );
};
