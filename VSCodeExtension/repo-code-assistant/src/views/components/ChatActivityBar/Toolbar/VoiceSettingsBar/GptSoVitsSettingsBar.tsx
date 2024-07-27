import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Form,
  Space,
  Tooltip,
  Typography,
  Drawer,
  Input,
  Select,
} from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  PointerSensor,
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidV4 } from 'uuid';

import type {
  ExtensionSettings,
  GptSoVitsVoiceSetting,
} from '../../../../../types';
import { MODEL_SERVICE_LINKS } from '../../../../../constants';
import { WebviewContext } from '../../../../WebviewContext';
import { GptSoVitsSettingsBarSortableItem } from './GptSoVitsSettingsBar/GptSoVitsSettingsBarSortableItem';

type GptSoVitsSettingsBarProps = {
  isOpen: boolean;
  onClose: () => void;
  handleEditGptSoVitsSettingsSave: (
    settings: Partial<ExtensionSettings>,
  ) => void;
};

export const GptSoVitsSettingsBar: React.FC<GptSoVitsSettingsBarProps> = ({
  isOpen,
  onClose,
  handleEditGptSoVitsSettingsSave,
}) => {
  const { callApi } = useContext(WebviewContext);

  const [partialSettings, setPartialSettings] = useState<{
    gptSoVitsClientHost: string;
    gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];
    gptSoVitsSelectedReferenceVoice: string;
  }>({
    gptSoVitsClientHost: '',
    gptSoVitsAvailableReferenceVoices: [],
    gptSoVitsSelectedReferenceVoice: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      const promises = Object.keys(partialSettings).map(async (key) => {
        try {
          const value = await callApi(
            'getSetting',
            key as keyof typeof partialSettings,
          );

          if (key === 'gptSoVitsAvailableReferenceVoices') {
            setPartialSettings((prev) => ({
              ...prev,
              gptSoVitsAvailableReferenceVoices:
                value as GptSoVitsVoiceSetting[],
            }));
            return;
          }

          setPartialSettings((prev) => ({ ...prev, [key]: value }));
        } catch (e) {
          console.error(`Failed to fetch setting ${key}:`, e);
        }
      });

      Promise.all(promises).finally(() => {
        setIsLoading(false);
      });
    } else {
      handleSave(partialSettings);
    }
  }, [isOpen]);

  const handleSave = (settingsToSave: typeof partialSettings) => {
    if (isLoading) return;

    setIsLoading(true);
    handleEditGptSoVitsSettingsSave(settingsToSave);

    const promises = Object.entries(settingsToSave).map(([key, value]) =>
      callApi('setSetting', key as keyof typeof partialSettings, value)
        .then(() => {
          callApi(
            'switchGptSoVitsReferenceVoice',
            settingsToSave.gptSoVitsSelectedReferenceVoice,
          ).catch(console.error);
        })
        .catch((e) =>
          callApi(
            'alertMessage',
            `Failed to save settings: ${e.message}`,
            'error',
          ),
        ),
    );

    Promise.all(promises).then(() => {
      callApi('alertMessage', 'Settings saved successfully', 'info').catch(
        console.error,
      );
    });
  };

  const handleVoiceChange = (
    id: string,
    field: keyof GptSoVitsVoiceSetting,
    value: string,
  ) => {
    const updatedVoices = partialSettings.gptSoVitsAvailableReferenceVoices.map(
      (voice) => (voice.id === id ? { ...voice, [field]: value } : voice),
    );
    setPartialSettings({
      ...partialSettings,
      gptSoVitsAvailableReferenceVoices: updatedVoices,
      gptSoVitsSelectedReferenceVoice:
        field === 'name' &&
        partialSettings.gptSoVitsSelectedReferenceVoice ===
          partialSettings.gptSoVitsAvailableReferenceVoices.find(
            (voice) => voice.id === id,
          )?.name
          ? value
          : partialSettings.gptSoVitsSelectedReferenceVoice,
    });
  };

  const handleAddVoice = () => {
    const newVoice = {
      id: `voice-${uuidV4()}`,
      name: 'New Voice',
      referWavPath: '',
      referText: '',
      promptLanguage: 'en',
    };
    setPartialSettings((prev) => ({
      ...prev,
      gptSoVitsAvailableReferenceVoices: [
        ...prev.gptSoVitsAvailableReferenceVoices,
        newVoice,
      ],
    }));
  };

  const handleRemoveVoice = (id: string) => {
    const updatedVoices =
      partialSettings.gptSoVitsAvailableReferenceVoices.filter(
        (voice) => voice.id !== id,
      );
    setPartialSettings({
      ...partialSettings,
      gptSoVitsAvailableReferenceVoices: updatedVoices,
      gptSoVitsSelectedReferenceVoice:
        partialSettings.gptSoVitsAvailableReferenceVoices.find(
          (voice) => voice.id === id,
        )?.name === partialSettings.gptSoVitsSelectedReferenceVoice
          ? ''
          : partialSettings.gptSoVitsSelectedReferenceVoice,
    });
  };

  const handleSelectedVoiceChange = (value: string) => {
    setPartialSettings({
      ...partialSettings,
      gptSoVitsSelectedReferenceVoice: value,
    });
  };

  const handleClientHostChange = (value: string) => {
    setPartialSettings({
      ...partialSettings,
      gptSoVitsClientHost: value,
    });
  };

  const openModelServiceLink = (settingKey: keyof ExtensionSettings) => {
    const link = MODEL_SERVICE_LINKS[settingKey];
    if (link) {
      callApi('openExternalLink', link)
        .then(() => {})
        .catch(console.error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex =
      partialSettings.gptSoVitsAvailableReferenceVoices.findIndex(
        (voice) => voice.id === active.id,
      );
    const overIndex =
      partialSettings.gptSoVitsAvailableReferenceVoices.findIndex(
        (voice) => voice.id === over.id,
      );

    if (activeIndex !== overIndex) {
      const updatedVoices = arrayMove(
        partialSettings.gptSoVitsAvailableReferenceVoices,
        activeIndex,
        overIndex,
      );
      setPartialSettings({
        ...partialSettings,
        gptSoVitsAvailableReferenceVoices: updatedVoices,
      });
      setActiveKey([]);
    }
  };

  return (
    <Drawer
      title='GPT-SoVits Settings'
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
                  onClick={() => openModelServiceLink('gptSoVitsClientHost')}
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
            value={partialSettings.gptSoVitsSelectedReferenceVoice}
            onChange={handleSelectedVoiceChange}
            placeholder='Select a reference voice'
            options={partialSettings.gptSoVitsAvailableReferenceVoices.map(
              (voice, index) => ({
                key: `gpvSoVitsVoice-${index}`,
                label: voice.name,
                value: voice.name,
              }),
            )}
          />
        </Form.Item>
        <Form.Item label={'Reference Voices'}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={partialSettings.gptSoVitsAvailableReferenceVoices.map(
                  (voice) => {
                    return {
                      key: voice.id,
                      id: voice.id,
                      name: voice.name,
                    };
                  },
                )}
                strategy={verticalListSortingStrategy}
              >
                {partialSettings.gptSoVitsAvailableReferenceVoices.map(
                  (voice) => (
                    <GptSoVitsSettingsBarSortableItem
                      key={voice.id}
                      id={voice.id}
                      voice={voice}
                      onVoiceChange={handleVoiceChange}
                      onRemoveVoice={handleRemoveVoice}
                      activeKey={activeKey}
                      setActiveKey={setActiveKey}
                    />
                  ),
                )}
              </SortableContext>
            </DndContext>
            <Button type='dashed' onClick={handleAddVoice} block>
              Add Voice
            </Button>
            <Typography.Text type={'secondary'}>
              Note: Chinese also support English content above
              GPT-SoVITS-beta0706 version.
            </Typography.Text>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
