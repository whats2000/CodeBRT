import React, { useContext, useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  Space,
  Collapse,
  Tooltip,
  Typography,
} from 'antd';

import {
  type ExtensionSettings,
  GptSoVitsVoiceSetting,
} from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { MODEL_SERVICE_LINKS } from '../../../../../constants';

const { Panel } = Collapse;
const { Option } = Select;

type GptSoVitsSettingsBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const GptSoVitsSettingsBar: React.FC<GptSoVitsSettingsBarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [partialSettings, setPartialSettings] = useState<{
    gptSoVitsClientHost: string;
    gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];
    selectedGptSoVitsReferenceVoice: string;
  }>({
    gptSoVitsClientHost: '',
    gptSoVitsAvailableReferenceVoices: [],
    selectedGptSoVitsReferenceVoice: '',
  });
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSave = (settingsToSave: typeof partialSettings) => {
    if (isLoading) return;

    setIsLoading(true);

    const promises = Object.entries(settingsToSave).map(([key, value]) =>
      callApi('setSetting', key as keyof typeof partialSettings, value).catch(
        (e) =>
          callApi(
            'alertMessage',
            `Failed to save settings: ${e.message}`,
            'error',
          ),
      ),
    );

    Promise.all(promises)
      .then(() => {
        callApi('alertMessage', 'Settings saved successfully', 'info').catch(
          console.error,
        );
      })
      .finally(onClose);
  };

  useEffect(() => {
    if (!isOpen) {
      handleSave(partialSettings);
    }
  }, [isOpen]);

  const handleVoiceChange = (
    index: number,
    field: keyof GptSoVitsVoiceSetting,
    value: string,
  ) => {
    const originalName =
      partialSettings.gptSoVitsAvailableReferenceVoices[index].name;

    const updatedVoices = [
      ...partialSettings.gptSoVitsAvailableReferenceVoices,
    ];

    updatedVoices[index][field] = value;
    setPartialSettings({
      ...partialSettings,
      selectedGptSoVitsReferenceVoice:
        field === 'name' &&
        partialSettings.selectedGptSoVitsReferenceVoice === originalName
          ? value
          : partialSettings.selectedGptSoVitsReferenceVoice,
      gptSoVitsAvailableReferenceVoices: updatedVoices,
    });
  };

  const handleAddVoice = () => {
    setPartialSettings({
      ...partialSettings,
      gptSoVitsAvailableReferenceVoices: [
        ...partialSettings.gptSoVitsAvailableReferenceVoices,
        {
          name: '',
          referWavPath: '',
          referText: '',
          promptLanguage: '',
        },
      ],
    });
  };

  const handleRemoveVoice = (index: number) => {
    const updatedVoices =
      partialSettings.gptSoVitsAvailableReferenceVoices?.filter(
        (_, i) => i !== index,
      );

    setPartialSettings({
      ...partialSettings,
      selectedGptSoVitsReferenceVoice:
        partialSettings.selectedGptSoVitsReferenceVoice ===
        partialSettings.gptSoVitsAvailableReferenceVoices[index].name
          ? ''
          : partialSettings.selectedGptSoVitsReferenceVoice,
      gptSoVitsAvailableReferenceVoices: updatedVoices,
    });
  };

  const handleSelectedVoiceChange = (value: string) => {
    const originalValue = partialSettings.selectedGptSoVitsReferenceVoice;

    setPartialSettings({
      ...partialSettings,
      selectedGptSoVitsReferenceVoice: value,
    });

    callApi('switchGptSoVitsReferenceVoice', value).catch((error: any) => {
      callApi(
        'alertMessage',
        `Failed to switch reference voice: ${error}`,
        'error',
      ).catch(console.error);
      setPartialSettings({
        ...partialSettings,
        selectedGptSoVitsReferenceVoice: originalValue,
      });
    });
  };

  const handleClientHostChange = (value: string) => {
    setPartialSettings({
      ...partialSettings,
      gptSoVitsClientHost: value,
    });
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
      title='GptSoVits Settings'
      placement='left'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      <Form layout='vertical'>
        <Form.Item
          label={
            <Space>
              <span>
                Client Host{' '}
                <Typography.Text type={'secondary'}>
                  (e.g. http://127.0.0.1:9880/)
                </Typography.Text>
              </span>
              <Tooltip title='Find out more about set up GPT-SoVits client host'>
                <Typography.Link
                  type={'secondary'}
                  onClick={() =>
                    openModelServiceLink(
                      'gptSoVitsClientHost' as keyof ExtensionSettings,
                    )
                  }
                >
                  Learn more
                </Typography.Link>
              </Tooltip>
            </Space>
          }
        >
          <Input.Password
            value={partialSettings.gptSoVitsClientHost}
            onChange={(e) => handleClientHostChange(e.target.value)}
          />
        </Form.Item>
        <Form.Item label='Selected Reference Voice'>
          <Select
            value={partialSettings.selectedGptSoVitsReferenceVoice}
            onChange={handleSelectedVoiceChange}
            placeholder='Select a reference voice'
          >
            {partialSettings.gptSoVitsAvailableReferenceVoices.map((voice) => (
              <Option key={voice.name} value={voice.name}>
                {voice.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Collapse bordered={false} size={'large'}>
            {partialSettings.gptSoVitsAvailableReferenceVoices.map(
              (voice, index) => (
                <Panel
                  header={voice.name || 'New Voice'}
                  key={index.toString()}
                  extra={
                    <Button danger onClick={() => handleRemoveVoice(index)}>
                      Remove
                    </Button>
                  }
                >
                  <Form.Item label='Name'>
                    <Input
                      value={voice.name}
                      onChange={(e) =>
                        handleVoiceChange(index, 'name', e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item label='Refer WAV Path'>
                    <Input
                      value={voice.referWavPath}
                      onChange={(e) =>
                        handleVoiceChange(index, 'referWavPath', e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item label='Refer Text'>
                    <Input
                      value={voice.referText}
                      onChange={(e) =>
                        handleVoiceChange(index, 'referText', e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item label='Prompt Language'>
                    <Select
                      value={voice.promptLanguage}
                      onChange={(value) =>
                        handleVoiceChange(index, 'promptLanguage', value)
                      }
                      options={[
                        { label: 'English', value: 'en' },
                        { label: 'Chinese', value: 'zh' },
                        { label: 'Japanese', value: 'ja' },
                      ]}
                    />
                  </Form.Item>
                </Panel>
              ),
            )}
          </Collapse>
          <Button type='dashed' onClick={handleAddVoice} block>
            Add Voice
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};
