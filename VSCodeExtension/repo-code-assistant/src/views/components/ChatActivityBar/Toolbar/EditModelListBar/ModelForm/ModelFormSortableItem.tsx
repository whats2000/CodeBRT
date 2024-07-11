import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Form, Input, Flex } from 'antd';
import { HolderOutlined } from '@ant-design/icons';

type ModelFormSortableItemProps = {
  id: string;
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
};

export const ModelFormSortableItem: React.FC<ModelFormSortableItemProps> = ({
  id,
  index,
  value,
  onChange,
  onRemove,
}) => {
  const { listeners, setNodeRef, transform, transition, setActivatorNodeRef } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Flex ref={setNodeRef} style={style} gap={10} align={'center'}>
      <Button
        ref={setActivatorNodeRef}
        type='text'
        size='small'
        icon={<HolderOutlined />}
        style={{ cursor: 'move' }}
        {...listeners}
      />
      <Form.Item label={`Model ${index + 1}`} style={{ width: '100%' }}>
        <Input
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
        />
      </Form.Item>
      <Form.Item label={' '}>
        <Button danger onClick={() => onRemove(index)}>
          Remove
        </Button>
      </Form.Item>
    </Flex>
  );
};
