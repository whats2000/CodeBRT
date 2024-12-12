import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { Button, Collapse, Flex, Form, Input, Select } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';

import type { GptSoVitsVoiceSetting } from '../../../../../../types';

type GptSoVitsSettingsBarSortableItemProps = {
  id: string;
  voice: GptSoVitsVoiceSetting;
  onVoiceChange: (
    id: string,
    field: keyof GptSoVitsVoiceSetting,
    value: string,
  ) => void;
  onRemoveVoice: (id: string) => void;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
};

export const GptSoVitsSettingsBarSortableItem: React.FC<
  GptSoVitsSettingsBarSortableItemProps
> = ({ id, voice, onVoiceChange, onRemoveVoice, activeKey, setActiveKey }) => {
  const { t } = useTranslation('common');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '8px',
  };

  return (
    <Flex ref={setNodeRef} style={style} align={'center'}>
      <Button
        ref={setActivatorNodeRef}
        type='text'
        icon={<HolderOutlined />}
        style={{ cursor: 'move', marginRight: '8px' }}
        {...listeners}
        {...attributes}
      />
      <Collapse
        style={{ width: '100%' }}
        bordered={false}
        activeKey={activeKey}
        onChange={(keys) => setActiveKey(keys as string[])}
        items={[
          {
            key: id,
            label: voice.name || t('gptSoVitsSettingsBarSortableItem.newVoice'),
            children: (
              <>
                <Form.Item
                  label={t('gptSoVitsSettingsBarSortableItem.nameLabel')}
                >
                  <Input
                    value={voice.name}
                    onChange={(e) => onVoiceChange(id, 'name', e.target.value)}
                  />
                </Form.Item>
                <Form.Item
                  label={t(
                    'gptSoVitsSettingsBarSortableItem.referWavPathLabel',
                  )}
                >
                  <Input
                    value={voice.referWavPath}
                    onChange={(e) =>
                      onVoiceChange(id, 'referWavPath', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={t('gptSoVitsSettingsBarSortableItem.referTextLabel')}
                >
                  <Input
                    value={voice.referText}
                    onChange={(e) =>
                      onVoiceChange(id, 'referText', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={t(
                    'gptSoVitsSettingsBarSortableItem.promptLanguageLabel',
                  )}
                >
                  <Select
                    value={voice.promptLanguage}
                    onChange={(value) =>
                      onVoiceChange(id, 'promptLanguage', value)
                    }
                    options={[
                      {
                        label: t(
                          'gptSoVitsSettingsBarSortableItem.englishLabel',
                        ),
                        value: 'en',
                      },
                      {
                        label: t(
                          'gptSoVitsSettingsBarSortableItem.chineseLabel',
                        ),
                        value: 'zh',
                      },
                      {
                        label: t(
                          'gptSoVitsSettingsBarSortableItem.japaneseLabel',
                        ),
                        value: 'ja',
                      },
                    ]}
                  />
                </Form.Item>
              </>
            ),
            extra: (
              <Button
                danger={true}
                type='text'
                size='small'
                onClick={() => onRemoveVoice(id)}
              >
                <DeleteOutlined style={{ cursor: 'pointer' }} />
              </Button>
            ),
          },
        ]}
      />
    </Flex>
  );
};
