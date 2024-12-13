import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Form, Input, Flex } from 'antd';
import { HolderOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

type ModelFormSortableItemProps = {
  id: string;
  index: number;
  value: string;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
};

export const ModelFormSortableItem: React.FC<ModelFormSortableItemProps> = ({
  id,
  index,
  value,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation('common');
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Flex ref={setNodeRef} style={style} align='center' gap={8}>
      <Form.Item label=' '>
        <Button
          type='text'
          icon={<HolderOutlined />}
          style={{ cursor: 'move' }}
          {...attributes}
          {...listeners}
        />
      </Form.Item>
      <Form.Item label={`${t('model')} ${index + 1}`} style={{ width: '100%' }}>
        <Input value={value} onChange={(e) => onChange(id, e.target.value)} />
      </Form.Item>
      <Form.Item label=' '>
        <Button
          danger
          type='text'
          icon={<DeleteOutlined />}
          onClick={() => onRemove(id)}
        />
      </Form.Item>
    </Flex>
  );
};
