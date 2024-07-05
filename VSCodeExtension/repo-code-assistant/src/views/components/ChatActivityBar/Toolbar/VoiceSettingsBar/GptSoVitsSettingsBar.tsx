import React, { useContext, useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Select, Space, Collapse } from 'antd';
import { WebviewContext } from '../../../../WebviewContext';
import { GptSoVitsVoiceSetting } from '../../../../../types/extensionSettings';

const { Panel } = Collapse;
const { Option } = Select;

interface GptSoVitsSettingsBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GptSoVitsSettingsBar: React.FC<GptSoVitsSettingsBarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [partialSettings, setPartialSettings] = useState<{
    gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];
    selectedGptSoVitsReferenceVoice: string;
  }>({
    gptSoVitsAvailableReferenceVoices: [],
    selectedGptSoVitsReferenceVoice: '',
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

  const handleSave = () => {
    setIsLoading(true);

    const promises = Object.entries(partialSettings).map(([key, value]) =>
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
      selectedGptSoVitsReferenceVoice:
        partialSettings.selectedGptSoVitsReferenceVoice ===
        partialSettings.gptSoVitsAvailableReferenceVoices[index].name
          ? ''
          : partialSettings.selectedGptSoVitsReferenceVoice,
      gptSoVitsAvailableReferenceVoices: updatedVoices,
    });
  };

  const handleSelectedVoiceChange = (value: string) => {
    callApi('switchGptSoVitsReferenceVoice', value)
      .then(() =>
        setPartialSettings({
          ...partialSettings,
          selectedGptSoVitsReferenceVoice: value,
        }),
      )
      .catch((error: any) => {
        callApi(
          'alertMessage',
          `Failed to switch reference voice: ${error}`,
          'error',
        ).catch(console.error);
      });
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
                    <Input
                      value={voice.promptLanguage}
                      onChange={(e) =>
                        handleVoiceChange(
                          index,
                          'promptLanguage',
                          e.target.value,
                        )
                      }
                    />
                  </Form.Item>
                </Panel>
              ),
            )}
          </Collapse>
          <Button type='dashed' onClick={handleAddVoice} block>
            Add Voice
          </Button>
          <Button type='primary' onClick={handleSave} block>
            Save
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};
