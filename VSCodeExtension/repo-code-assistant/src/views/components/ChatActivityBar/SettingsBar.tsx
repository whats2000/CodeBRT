import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { Drawer, Form, Input, Checkbox } from 'antd';

import { ExtensionSettings } from '../../../types/extensionSettings';
import { WebviewContext } from '../../WebviewContext';

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
    huggingFaceApiKey: '',
    groqApiKey: '',
    geminiApiKey: '',
    openAiApiKey: '',
    cohereApiKey: '',
    enableModel: {
      gemini: false,
      openai: false,
      cohere: false,
      groq: false,
      huggingFace: false,
      custom: false,
    },
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

  const saveSettings = (updatedSettings: ExtensionSettings) => {
    Object.entries(updatedSettings).forEach(([key, value]) => {
      callApi('updateSetting', key as keyof ExtensionSettings, value)
        .then(() =>
          callApi('alertMessage', 'Settings saved successfully', 'info'),
        )
        .catch((e) =>
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
          }
        })}
      </StyledForm>
    </Drawer>
  );
};
