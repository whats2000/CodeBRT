import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import {
  Drawer,
  Form,
  Input,
  Checkbox,
  Select,
  ColorPicker,
  Button,
} from 'antd';
import type { Color } from 'antd/es/color-picker/color';

import type { ExtensionSettings, ModelType } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

type SettingSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsBar: React.FC<SettingSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [partialSettings, setPartialSettings] = useState<
    Partial<ExtensionSettings> & {
      enableModel: { [key in ModelType]: boolean };
    }
  >({
    groqApiKey: '',
    geminiApiKey: '',
    openaiApiKey: '',
    cohereApiKey: '',
    huggingFaceApiKey: '',
    ollamaClientHost: '',
    gptSoVitsClientHost: '',
    enableModel: {
      gemini: false,
      openai: false,
      cohere: false,
      groq: false,
      huggingFace: false,
      ollama: false,
      custom: false,
    },
    themePrimaryColor: '#1677ff',
    themeAlgorithm: 'defaultAlgorithm',
    themeBorderRadius: 4,
  });
  const [isLoading, setIsLoading] = useState(false);

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
          if (key === 'enableModel' && Object.keys(value).length === 0) {
            value = partialSettings.enableModel;
          }
          setPartialSettings((prev) => ({ ...prev, [key]: value }));
        } catch (e) {
          console.error(`Failed to fetch setting ${key}:`, e);
        }
      });

      // Use Promise.all to wait for all API calls to complete
      Promise.all(promises).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleSettingChange =
    (
      key:
        | keyof Partial<ExtensionSettings>
        | keyof typeof partialSettings.enableModel,
    ) =>
    (event: any) => {
      if (key in partialSettings.enableModel) {
        setPartialSettings((prev) => ({
          ...prev,
          enableModel: {
            ...prev.enableModel,
            [key]: event.target.checked,
          },
        }));
        saveSettings({
          ...partialSettings,
          enableModel: {
            ...partialSettings.enableModel,
            [key]: event.target.checked,
          },
        });
      } else {
        setPartialSettings((prev) => ({ ...prev, [key]: event.target.value }));
      }
    };

  const handleBlurSave = () => {
    saveSettings(partialSettings);
  };

  const handleColorChange = (color: Color) => {
    setPartialSettings((prev) => ({
      ...prev,
      themePrimaryColor: color.toHexString(),
    }));
    saveSettings({
      ...partialSettings,
      themePrimaryColor: color.toHexString(),
    });
  };

  const handleAlgorithmChange = (
    value: 'darkAlgorithm' | 'defaultAlgorithm' | 'compactAlgorithm',
  ) => {
    setPartialSettings((prev) => ({ ...prev, themeAlgorithm: value }));
    saveSettings({ ...partialSettings, themeAlgorithm: value });
  };

  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value);
    setPartialSettings((prev) => ({ ...prev, themeBorderRadius: value }));
    saveSettings({ ...partialSettings, themeBorderRadius: value });
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

  const saveSettings = (
    updatedSettings: Partial<ExtensionSettings> & {
      enableModel: { [key in ModelType]: boolean };
    },
  ) => {
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
          if (key === 'enableModel') {
            return (
              <FormGroup
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')
                }
              >
                <CheckboxGroup>
                  {Object.entries(value).map(([modelKey, modelValue]) => (
                    <Checkbox
                      key={modelKey}
                      checked={modelValue}
                      onChange={(event) => {
                        handleSettingChange(
                          modelKey as keyof typeof partialSettings.enableModel,
                        )(event);
                      }}
                    >
                      {modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </FormGroup>
            );
          } else if (key.includes('ApiKey') || key.includes('ClientHost')) {
            return (
              <FormGroup
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')
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
