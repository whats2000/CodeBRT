import React, { useState, useEffect, useContext } from 'react';
import { WebviewContext } from './WebviewContext';
import { ExtensionSettings } from "../types/extensionSettings";
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
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
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  color: lightgrey;
  padding: 8px;
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
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
  const [settings, setSettings] = useState<Partial<ExtensionSettings>>({
    geminiApiKey: '',
    openAIApiKey: '',
  });

  useEffect(() => {
    Object.keys(settings).forEach(key => {
      callApi("getSetting", key as keyof ExtensionSettings)
        .then((value: any) => {
          setSettings(prev => ({ ...prev, [key]: value }));
        })
        .catch(e => console.error(`Failed to fetch setting ${key}:`, e));
    });
  }, []);

  const handleSettingChange = (key: keyof ExtensionSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [key]: event.target.value }));
  };

  const saveSettings = () => {
    Object.entries(settings).forEach(([key, value]) => {
      callApi("updateSetting", key as keyof ExtensionSettings, value)
        .then(() => callApi("alertMessage", "Settings saved successfully", "info"))
        .catch(e => callApi("alertMessage", `Failed to save settings: ${e.message}`, "error"));
    });
  };

  return (
    <Container>
      <Title>Settings Bar</Title>
      <Form onSubmit={(e) => {
        e.preventDefault();
        saveSettings();
      }}>
        {Object.entries(settings).map(([key, value]) => (
          <FormGroup key={key}>
            <Label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + key.replace(/([A-Z])/g, ' $1').slice(1)}:</Label>
            <Input
              id={key}
              type="text"
              value={value as string || ''}
              onChange={handleSettingChange(key as keyof ExtensionSettings)}
            />
          </FormGroup>
        ))}
        <Button type="submit">Save Settings</Button>
      </Form>
    </Container>
  );
};
