import React, { useContext, useEffect, useState } from 'react';
import { Drawer, Form, Select } from 'antd';
import { WebviewContext } from '../../../WebviewContext';
import { VoiceType } from '../../../../types/voiceType';

const { Option } = Select;

interface VoiceSettingsBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsBar: React.FC<VoiceSettingsBarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [selectedTextToVoiceService, setSelectedTextToVoiceService] =
    useState<VoiceType>('not set');
  const [selectedVoiceToTextService, setSelectedVoiceToTextService] =
    useState<VoiceType>('not set');
  const [isLoading, setIsLoading] = useState(false);
  const textToVoiceServices: VoiceType[] = ['not set', 'gptSoVits'];
  const voiceToTextServices: VoiceType[] = ['not set'];

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      callApi('getSelectedVoiceService')
        .then((service: { textToVoice: VoiceType; voiceToText: VoiceType }) => {
          setSelectedTextToVoiceService(service.textToVoice);
          setSelectedVoiceToTextService(service.voiceToText);
          setIsLoading(false);
        })
        .catch((error: any) => {
          callApi(
            'alertMessage',
            `Failed to load Text To Voice service: ${error}`,
            'error',
          ).catch(console.error);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleServiceChange = (
    field: 'selectedTextToVoiceService' | 'selectedVoiceToTextService',
    value: string,
  ) => {
    if (field === 'selectedTextToVoiceService') {
      callApi('saveSelectedTextToVoiceService', value as VoiceType)
        .then(() => setSelectedTextToVoiceService(value as VoiceType))
        .catch(console.error);
    } else {
      callApi('saveSelectedVoiceToTextService', value as VoiceType)
        .then(() => setSelectedVoiceToTextService(value as VoiceType))
        .catch(console.error);
    }
  };

  return (
    <Drawer
      title='Voice Settings'
      placement='left'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      <Form layout='vertical'>
        <Form.Item label='Text To Voice Service'>
          <Select
            value={selectedTextToVoiceService}
            onChange={(value) =>
              handleServiceChange('selectedTextToVoiceService', value)
            }
          >
            {textToVoiceServices.map((service) => (
              <Option key={service} value={service}>
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label='Voice To Text Service'>
          <Select
            value={selectedVoiceToTextService}
            onChange={(value) =>
              handleServiceChange('selectedVoiceToTextService', value)
            }
          >
            {voiceToTextServices.map((service) => (
              <Option key={service} value={service}>
                {service}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
