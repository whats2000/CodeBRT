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

import { ExtensionSettings } from '../../../types/extensionSettings';
import { WebviewContext } from '../../WebviewContext';
import type { Color } from 'antd/es/color-picker/color';

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

interface SettingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsBar: React.FC<SettingSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [settings, setSettings] = useState<ExtensionSettings>({
    lastUsedModel: 'gemini',
    selectedCustomModel: '',
    customModels: [],
    groqApiKey: '',
    groqAvailableModels: [],
    geminiApiKey: '',
    geminiAvailableModels: [],
    openAiApiKey: '',
    openAiAvailableModels: [],
    cohereApiKey: '',
    cohereAvailableModels: [],
    huggingFaceApiKey: '',
    huggingFaceAvailableModels: [],
    enableModel: {
      gemini: false,
      openai: false,
      cohere: false,
      groq: false,
      huggingFace: false,
      custom: false,
    },
    themePrimaryColor: '#1677ff',
    themeAlgorithm: 'defaultAlgorithm',
    themeBorderRadius: 4,
  });
  const [settingBarLoading, setSettingBarLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettingBarLoading(true);
      Object.keys(settings).forEach((key) => {
        callApi('getSetting', key as keyof typeof settings)
          .then((value: any) => {
            if (key === 'enableModel' && Object.keys(value).length === 0) {
              value = settings.enableModel;
            }
            setSettings((prev) => ({ ...prev, [key]: value }));
            setSettingBarLoading(false);
          })
          .catch((e) => {
            console.error(`Failed to fetch setting ${key}:`, e);
            setSettingBarLoading(false);
          });
      });
    }
  }, [isOpen]);

  const handleSettingChange =
    (
      key: keyof Partial<ExtensionSettings> | keyof typeof settings.enableModel,
    ) =>
    (event: any) => {
      if (key in settings.enableModel) {
        setSettings((prev) => ({
          ...prev,
          enableModel: {
            ...prev.enableModel,
            [key]: event.target.checked,
          },
        }));
        saveSettings({
          ...settings,
          enableModel: {
            ...settings.enableModel,
            [key]: event.target.checked,
          },
        });
      } else {
        setSettings((prev) => ({ ...prev, [key]: event.target.value }));
      }
    };

  const handleBlurSave = () => {
    saveSettings(settings);
  };

  const handleColorChange = (color: Color) => {
    setSettings((prev) => ({
      ...prev,
      themePrimaryColor: color.toHexString(),
    }));
    saveSettings({ ...settings, themePrimaryColor: color.toHexString() });
  };

  const handleAlgorithmChange = (
    value: 'darkAlgorithm' | 'defaultAlgorithm' | 'compactAlgorithm',
  ) => {
    setSettings((prev) => ({ ...prev, themeAlgorithm: value }));
    saveSettings({ ...settings, themeAlgorithm: value });
  };

  const handleBorderRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value);
    setSettings((prev) => ({ ...prev, themeBorderRadius: value }));
    saveSettings({ ...settings, themeBorderRadius: value });
  };

  const resetTheme = () => {
    setSettings((prev) => ({
      ...prev,
      themePrimaryColor: '#f1f1f1',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    }));
    saveSettings({
      ...settings,
      themePrimaryColor: '#f1f1f1',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    });
  };

  const saveSettings = (updatedSettings: ExtensionSettings) => {
    Object.entries(updatedSettings).forEach(([key, value]) => {
      callApi('updateSetting', key as keyof ExtensionSettings, value).catch(
        (e) =>
          callApi(
            'alertMessage',
            `Failed to save settings: ${e.message}`,
            'error',
          ),
      );
    });
  };

  return (
    <Drawer
      title='Settings Bar'
      open={isOpen}
      onClose={onClose}
      placement='left'
      width={400}
      loading={settingBarLoading}
    >
      <StyledForm layout='vertical' onFinish={() => saveSettings(settings)}>
        {Object.entries(settings).map(([key, value]) => {
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
                          modelKey as keyof typeof settings.enableModel,
                        )(event);
                      }}
                    >
                      {modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </FormGroup>
            );
          } else if (key.includes('ApiKey')) {
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
                  onChange={handleSettingChange(key as keyof typeof settings)}
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
