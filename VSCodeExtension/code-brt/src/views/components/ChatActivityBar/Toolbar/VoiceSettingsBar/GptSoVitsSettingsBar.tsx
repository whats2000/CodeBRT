import React, { useContext, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';

import type { GptSoVitsVoiceSetting } from '../../../../../types';
import type { AppDispatch, RootState } from '../../../../redux';
import { MODEL_SERVICE_CONSTANTS } from '../../../../../constants';
import { WebviewContext } from '../../../../WebviewContext';
import { GptSoVitsSettingsBarSortableItem } from './GptSoVitsSettingsBar/GptSoVitsSettingsBarSortableItem';
import {
  saveSettings,
  updateLocalSetting,
} from '../../../../redux/slices/settingsSlice';

type GptSoVitsSettingsBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const GptSoVitsSettingsBar: React.FC<GptSoVitsSettingsBarProps> = ({
  isOpen,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);

  const dispatch = useDispatch<AppDispatch>();

  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings,
  );

  const [activeKey, setActiveKey] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const onCloseAndSave = () => {
    if (isLoading) {
      onClose();
      return;
    }

    dispatch(saveSettings(settings));

    callApi(
      'switchGptSoVitsReferenceVoice',
      settings.gptSoVitsSelectedReferenceVoice,
    ).catch(console.error);

    onClose();
  };

  const handleVoiceChange = (
    id: string,
    field: keyof GptSoVitsVoiceSetting,
    value: string,
  ) => {
    const updatedVoices = settings.gptSoVitsAvailableReferenceVoices.map(
      (voice) => (voice.id === id ? { ...voice, [field]: value } : voice),
    );
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsAvailableReferenceVoices',
        value: updatedVoices,
      }),
    );
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsSelectedReferenceVoice',
        value:
          field === 'name' &&
          settings.gptSoVitsSelectedReferenceVoice ===
            settings.gptSoVitsAvailableReferenceVoices.find(
              (voice) => voice.id === id,
            )?.name
            ? value
            : settings.gptSoVitsSelectedReferenceVoice,
      }),
    );
  };

  const handleAddVoice = () => {
    const newVoice = {
      id: `voice-${uuidV4()}`,
      name: 'New Voice',
      referWavPath: '',
      referText: '',
      promptLanguage: 'en' as GptSoVitsVoiceSetting['promptLanguage'],
    };

    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsAvailableReferenceVoices',
        value: [...settings.gptSoVitsAvailableReferenceVoices, newVoice],
      }),
    );
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsSelectedReferenceVoice',
        value: settings.gptSoVitsSelectedReferenceVoice || newVoice.name,
      }),
    );
  };

  const handleRemoveVoice = (id: string) => {
    const updatedVoices = settings.gptSoVitsAvailableReferenceVoices.filter(
      (voice) => voice.id !== id,
    );
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsAvailableReferenceVoices',
        value: updatedVoices,
      }),
    );
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsSelectedReferenceVoice',
        value:
          settings.gptSoVitsAvailableReferenceVoices.find(
            (voice) => voice.id === id,
          )?.name === settings.gptSoVitsSelectedReferenceVoice
            ? ''
            : settings.gptSoVitsSelectedReferenceVoice,
      }),
    );
  };

  const handleSelectedVoiceChange = (value: string) => {
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsSelectedReferenceVoice',
        value,
      }),
    );
  };

  const handleClientHostChange = (value: string) => {
    dispatch(
      updateLocalSetting({
        key: 'gptSoVitsClientHost',
        value,
      }),
    );
  };

  const openLink = (link: string) => {
    callApi('openExternalLink', link).catch(console.error);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex = settings.gptSoVitsAvailableReferenceVoices.findIndex(
      (voice) => voice.id === active.id,
    );
    const overIndex = settings.gptSoVitsAvailableReferenceVoices.findIndex(
      (voice) => voice.id === over.id,
    );

    if (activeIndex !== overIndex) {
      const updatedVoices = arrayMove(
        settings.gptSoVitsAvailableReferenceVoices,
        activeIndex,
        overIndex,
      );
      dispatch(
        updateLocalSetting({
          key: 'gptSoVitsAvailableReferenceVoices',
          value: updatedVoices,
        }),
      );
      setActiveKey([]);
    }
  };

  return (
    <Drawer
      title='GPT-SoVits Settings'
      placement='left'
      open={isOpen}
      onClose={onCloseAndSave}
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
                    openLink(MODEL_SERVICE_CONSTANTS.gptSoVits.apiLink)
                  }
                >
                  Learn more
                </Typography.Link>
              </Tooltip>
            </Space>
          }
        >
          <Input.Password
            value={settings.gptSoVitsClientHost}
            onChange={(e) => handleClientHostChange(e.target.value)}
          />
        </Form.Item>
        <Form.Item label='Selected Reference Voice'>
          <Select
            value={settings.gptSoVitsSelectedReferenceVoice}
            onChange={handleSelectedVoiceChange}
            placeholder='Select a reference voice'
            options={settings.gptSoVitsAvailableReferenceVoices.map(
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
                items={settings.gptSoVitsAvailableReferenceVoices.map(
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
                {settings.gptSoVitsAvailableReferenceVoices.map((voice) => (
                  <GptSoVitsSettingsBarSortableItem
                    key={voice.id}
                    id={voice.id}
                    voice={voice}
                    onVoiceChange={handleVoiceChange}
                    onRemoveVoice={handleRemoveVoice}
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                  />
                ))}
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
