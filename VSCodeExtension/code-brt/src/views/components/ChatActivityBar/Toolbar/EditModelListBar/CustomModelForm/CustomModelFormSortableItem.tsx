import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Checkbox,
  Collapse,
  Flex,
  Form,
  Input,
  Select,
  Typography,
} from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import type { CustomModelSettings } from '../../../../../../types';

type CustomModelSortableItemProps = {
  id: string;
  index: number;
  model: CustomModelSettings;
  onModelChange: (
    id: string,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => void;
  onRemoveModel: (id: string) => void;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
};

export const CustomModelSortableItem: React.FC<
  CustomModelSortableItemProps
> = ({ id, model, onModelChange, onRemoveModel, activeKey, setActiveKey }) => {
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
            label: model.name || t('newModel'),
            children: (
              <>
                <Form.Item label={t('name')}>
                  <Input
                    value={model.name}
                    onChange={(e) => onModelChange(id, 'name', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label={t('customModelFormSortableItem.apiUrl')}>
                  <Input
                    value={model.apiUrl}
                    onChange={(e) =>
                      onModelChange(id, 'apiUrl', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label={t('customModelFormSortableItem.apiMethod')}>
                  <Select
                    value={model.apiMethod}
                    onChange={(value) => onModelChange(id, 'apiMethod', value)}
                  >
                    <Select.Option value='GET'>GET</Select.Option>
                    <Select.Option value='POST'>POST</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label={t('customModelFormSortableItem.textParameter')}
                >
                  <Input
                    value={model.apiTextParam}
                    onChange={(e) =>
                      onModelChange(id, 'apiTextParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={t('customModelFormSortableItem.imageParameter')}
                >
                  <Input
                    value={model.apiImageParam}
                    onChange={(e) =>
                      onModelChange(id, 'apiImageParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={t('customModelFormSortableItem.queryParameter')}
                >
                  <Input
                    value={model.apiQueryParam}
                    onChange={(e) =>
                      onModelChange(id, 'apiQueryParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={t('customModelFormSortableItem.includeQueryInHistory')}
                >
                  <Checkbox
                    checked={model.includeQueryInHistory}
                    onChange={(e) =>
                      onModelChange(
                        id,
                        'includeQueryInHistory',
                        e.target.checked,
                      )
                    }
                  >
                    <Typography.Text type='secondary'>
                      {t(
                        'customModelFormSortableItem.checkToAppendQueryToHistory',
                      )}
                    </Typography.Text>
                  </Checkbox>
                </Form.Item>
              </>
            ),
            extra: (
              <Button
                danger={true}
                type='text'
                size='small'
                onClick={() => onRemoveModel(id)}
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
