import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { ExtensionSettings } from '../types/extensionSettings';
import { WebviewContext } from './WebviewContext';

// Styled components
const Container = styled.div`
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1``;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 20px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;

  label {
    margin-bottom: 10px;
  }
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background-color: #00408a;
  }
`;

export const SettingsBar = () => {
  const { callApi } = useContext(WebviewContext);
  const [settings, setSettings] = useState<ExtensionSettings>({
    lastUsedModel: 'gemini',
    geminiApiKey: '',
    openAiApiKey: '',
    cohereApiKey: '',
    groqApiKey: '',
    enableModel: {
      gemini: false,
      openai: false,
      cohere: false,
      groq: false,
    },
  });

  useEffect(() => {
    Object.keys(settings).forEach((key) => {
      callApi('getSetting', key as keyof typeof settings)
        .then((value: any) => {
          if (key === 'enableModel' && Object.keys(value).length === 0) {
            value = settings.enableModel;
          }
          setSettings((prev) => ({ ...prev, [key]: value }));
        })
        .catch((e) => console.error(`Failed to fetch setting ${key}:`, e));
    });
  }, []);

  const handleSettingChange =
    (
      key: keyof Partial<ExtensionSettings> | keyof typeof settings.enableModel,
    ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (key in settings.enableModel) {
        setSettings((prev) => ({
          ...prev,
          enableModel: {
            ...prev.enableModel,
            [key]: event.target.checked,
          },
        }));
      } else {
        setSettings((prev) => ({ ...prev, [key]: event.target.value }));
      }
    };

  const saveSettings = () => {
    Object.entries(settings).forEach(([key, value]) => {
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
    <Container>
      <Title>Settings Bar</Title>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings();
        }}
      >
        {Object.entries(settings).map(([key, value]) => {
          if (key === 'enableModel') {
            return (
              <FormGroup key={key}>
                <Label>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .charAt(0)
                    .toUpperCase() + key.replace(/([A-Z])/g, ' $1').slice(1)}
                </Label>
                <CheckboxContainer>
                  {Object.entries(value).map(([modelKey, modelValue]) => (
                    <CheckboxLabel key={modelKey}>
                      <Input
                        type='checkbox'
                        id={modelKey}
                        checked={modelValue}
                        onChange={handleSettingChange(
                          modelKey as keyof typeof settings.enableModel,
                        )}
                      />
                      <label htmlFor={modelKey}>
                        {modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}
                      </label>
                    </CheckboxLabel>
                  ))}
                </CheckboxContainer>
              </FormGroup>
            );
          } else {
            return (
              <FormGroup key={key}>
                <Label htmlFor={key}>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .charAt(0)
                    .toUpperCase() + key.replace(/([A-Z])/g, ' $1').slice(1)}
                  :
                </Label>
                <Input
                  id={key}
                  type='text'
                  value={(value as string) || ''}
                  onChange={handleSettingChange(key as keyof typeof settings)}
                />
              </FormGroup>
            );
          }
        })}
        <Button type='submit'>Save Settings</Button>
      </Form>
    </Container>
  );
};
