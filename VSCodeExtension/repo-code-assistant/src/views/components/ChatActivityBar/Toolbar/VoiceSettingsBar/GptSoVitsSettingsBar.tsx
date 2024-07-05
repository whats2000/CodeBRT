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
  const [
    gptSoVitsAvailableReferenceVoices,
    setGptSoVitsAvailableReferenceVoices,
  ] = useState<GptSoVitsVoiceSetting[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      callApi('getGptSoVitsAvailableReferenceVoices')
        .then((voices: GptSoVitsVoiceSetting[]) => {
          setGptSoVitsAvailableReferenceVoices(voices);
          setIsLoading(false);
        })
        .catch((error: any) => {
          callApi(
            'alertMessage',
            `Failed to load available reference voices: ${error}`,
            'error',
          ).catch(console.error);
          setIsLoading(false);
        });

      callApi('getSelectedGptSoVitsReferenceVoice')
        .then((voice: GptSoVitsVoiceSetting | undefined) => {
          setSelectedVoice(voice?.name);
        })
        .catch((error: any) => {
          callApi(
            'alertMessage',
            `Failed to load selected reference voice: ${error}`,
            'error',
          ).catch(console.error);
        });
    }
  }, [isOpen]);

  const handleSave = () => {
    setIsLoading(true);
    callApi(
      'setGptSoVitsAvailableReferenceVoices',
      gptSoVitsAvailableReferenceVoices,
    )
      .then(() => {
        callApi('alertMessage', 'Settings saved successfully', 'info').catch(
          console.error,
        );
        setIsLoading(false);
        onClose();
      })
      .catch((error: any) => {
        callApi(
          'alertMessage',
          `Failed to save settings: ${error}`,
          'error',
        ).catch(console.error);
        setIsLoading(false);
      });
  };

  const handleVoiceChange = (
    index: number,
    field: keyof GptSoVitsVoiceSetting,
    value: string,
  ) => {
    const updatedVoices = [...gptSoVitsAvailableReferenceVoices];
    updatedVoices[index][field] = value;
    setGptSoVitsAvailableReferenceVoices(updatedVoices);
  };

  const handleAddVoice = () => {
    setGptSoVitsAvailableReferenceVoices([
      ...gptSoVitsAvailableReferenceVoices,
      {
        name: '',
        referWavPath: '',
        referText: '',
        promptLanguage: '',
      },
    ]);
  };

  const handleRemoveVoice = (index: number) => {
    const updatedVoices = gptSoVitsAvailableReferenceVoices.filter(
      (_, i) => i !== index,
    );

    if (selectedVoice === gptSoVitsAvailableReferenceVoices[index].name) {
      setSelectedVoice(undefined);
    }
    setGptSoVitsAvailableReferenceVoices(updatedVoices);
  };

  const handleSelectedVoiceChange = (value: string) => {
    callApi('switchGptSoVitsReferenceVoice', value)
      .then(() => setSelectedVoice(value))
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
            value={selectedVoice}
            onChange={handleSelectedVoiceChange}
            placeholder='Select a reference voice'
          >
            {gptSoVitsAvailableReferenceVoices.map((voice) => (
              <Option key={voice.name} value={voice.name}>
                {voice.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Collapse bordered={false} size={'large'}>
            {gptSoVitsAvailableReferenceVoices.map((voice, index) => (
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
                      handleVoiceChange(index, 'promptLanguage', e.target.value)
                    }
                  />
                </Form.Item>
              </Panel>
            ))}
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
