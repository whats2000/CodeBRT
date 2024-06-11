import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { ExtensionSettings } from '../../../types/extensionSettings';
import { WebviewContext } from '../../WebviewContext';
import { ModelType } from '../../../types/modelType';

// Styled components
const SettingSidebar = styled.div<{ $isOpen: boolean }>`
  width: 80%;
  position: fixed;
  z-index: 1;
  top: 0;
  left: ${(props) => (props.$isOpen ? '0' : '-80%')};
  height: 100%;
  background-color: #111;
  overflow-y: scroll;
  overflow-x: hidden;
  transition: left 0.5s;
  padding-top: 10px;
  color: white;

  /* Custom scrollbar styles for WebKit browsers */
  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #111;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #555;
    border-radius: 10px;
    border: 3px solid #111;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #888;
  }

  /* Custom scrollbar styles for other browsers */
  scrollbar-width: thin;
  scrollbar-color: #555 #111;
`;

const CloseBtn = styled.span`
  position: absolute;
  top: 10px;
  right: 5px;
  font-size: 36px;
  cursor: pointer;
  text-align: center;
  line-height: 30px;
  border-radius: 4px;
  width: 30px;
  height: 30px;

  &:hover {
    background-color: #333;
  }
`;

const Container = styled.div`
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const Title = styled.h1`
  padding-bottom: 15px;
  justify-content: center;
  text-align: center;
`;

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

interface SettingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
}

export const SettingsBar: React.FC<SettingSidebarProps> = ({
  isOpen,
  onClose,
  activeModel,
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

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, activeModel]);

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
    <SettingSidebar $isOpen={isOpen}>
      <CloseBtn onClick={onClose}>&times;</CloseBtn>
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
            } else if (key.includes('ApiKey')) {
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
    </SettingSidebar>
  );
};
