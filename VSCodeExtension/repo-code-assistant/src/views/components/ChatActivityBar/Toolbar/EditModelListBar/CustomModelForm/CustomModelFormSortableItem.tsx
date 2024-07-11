import type { CustomModelSettings } from '../../../../../../types';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Checkbox, Collapse, Flex, Form, Input, Select } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';

type SortableItemProps = {
  id: string;
  index: number;
  model: CustomModelSettings;
  onModelChange: (
    index: number,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => void;
  onRemoveModel: (index: number) => void;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
};

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  model,
  onModelChange,
  onRemoveModel,
  activeKey,
  setActiveKey,
}) => {
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
            key: index.toString(),
            label: model.name || 'New Model',
            children: (
              <>
                <Form.Item label='Name'>
                  <Input
                    value={model.name}
                    onChange={(e) =>
                      onModelChange(index, 'name', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='API URL'>
                  <Input
                    value={model.apiUrl}
                    onChange={(e) =>
                      onModelChange(index, 'apiUrl', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='API Method'>
                  <Select
                    value={model.apiMethod}
                    onChange={(value) =>
                      onModelChange(index, 'apiMethod', value)
                    }
                  >
                    <Select.Option value='GET'>GET</Select.Option>
                    <Select.Option value='POST'>POST</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label='Text Parameter'>
                  <Input
                    value={model.apiTextParam}
                    onChange={(e) =>
                      onModelChange(index, 'apiTextParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='Image Parameter'>
                  <Input
                    value={model.apiImageParam}
                    onChange={(e) =>
                      onModelChange(index, 'apiImageParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='Query Parameter'>
                  <Input
                    value={model.apiQueryParam}
                    onChange={(e) =>
                      onModelChange(index, 'apiQueryParam', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='Include Query in History'>
                  <Checkbox
                    checked={model.includeQueryInHistory}
                    onChange={(e) =>
                      onModelChange(
                        index,
                        'includeQueryInHistory',
                        e.target.checked,
                      )
                    }
                  />
                </Form.Item>
              </>
            ),
            extra: (
              <Button
                danger={true}
                type='text'
                size='small'
                onClick={() => onRemoveModel(index)}
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
