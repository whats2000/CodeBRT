import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Collapse, Flex, Form, Input } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';

import type { OpenRouterModelSettings } from '../../../../../../types';

type OpenRouterModelSortableItemProps = {
  uuid: string;
  index: number;
  model: OpenRouterModelSettings;
  onModelChange: (
    uuid: string,
    field: keyof OpenRouterModelSettings,
    value: string,
  ) => void;
  onRemoveModel: (uuid: string) => void;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
};

export const OpenRouterSortableItem: React.FC<
  OpenRouterModelSortableItemProps
> = ({
  uuid,
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
  } = useSortable({ id: uuid });

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
            key: uuid,
            label: model.name || 'New Model',
            children: (
              <>
                <Form.Item label='id'>
                  <Input
                    value={model.id}
                    onChange={(e) => onModelChange(uuid, 'id', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label='Name'>
                  <Input
                    value={model.name}
                    onChange={(e) =>
                      onModelChange(uuid, 'name', e.target.value)
                    }
                  />
                </Form.Item>
                <Form.Item label='API Key'>
                  <Input
                    value={model.apiKey}
                    onChange={(e) =>
                      onModelChange(uuid, 'apiKey', e.target.value)
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
                onClick={() => onRemoveModel(uuid)}
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
