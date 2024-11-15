import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, Space } from 'antd';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidV4 } from 'uuid';

import type { OpenRouterModelSettings } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { OpenRouterSortableItem } from './OpenRouterModelForm/OpenRouterModelFormSortableItem';

type OpenRouterModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  openRouterModels: OpenRouterModelSettings[];
  setOpenRouterModels: React.Dispatch<
    React.SetStateAction<OpenRouterModelSettings[]>
  >;
  handleEditModelListSave: (models: string[]) => void;
};

export const OpenRouterModelForm: React.FC<OpenRouterModelFormProps> = ({
  isOpen,
  isLoading,
  openRouterModels,
  setOpenRouterModels,
  handleEditModelListSave,
}) => {
  const { callApi } = useContext(WebviewContext);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [activeKey, setActiveKey] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      handleSave(openRouterModels);
    }
  }, [isOpen]);

  const handleSave = (modelsToSave: OpenRouterModelSettings[]) => {
    if (isLoading) return;

    callApi('setOpenRouterModels', modelsToSave)
      .then(() => {
        handleEditModelListSave(modelsToSave.map((model) => model.name));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleAddModel = () => {
    setOpenRouterModels([
      ...openRouterModels,
      {
        uuid: uuidV4(),
        id: '',
        name: 'New Model',
        apiKey: '',
      },
    ]);
  };

  const handleModelChange = (
    uuid: string,
    field: keyof OpenRouterModelSettings,
    value: string,
  ) => {
    setOpenRouterModels(
      openRouterModels.map((model) =>
        model.uuid === uuid ? { ...model, [field]: value } : model,
      ),
    );
  };

  const handleRemoveModel = (uuid: string) => {
    const updatedModels = openRouterModels.filter(
      (model) => model.uuid !== uuid,
    );
    setOpenRouterModels(updatedModels);
    setActiveKey(activeKey.filter((key) => key !== uuid));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex = openRouterModels.findIndex(
      (model) => model.uuid === active.id,
    );

    const overIndex = openRouterModels.findIndex(
      (model) => model.uuid === over.id,
    );

    if (activeIndex !== overIndex) {
      const updatedModels = arrayMove(openRouterModels, activeIndex, overIndex);
      setOpenRouterModels(updatedModels);
      setActiveKey([]);
    }
  };

  return (
    <Form layout='vertical'>
      <Space direction='vertical' style={{ width: '100%' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={openRouterModels.map((model) => model.uuid)}
            strategy={verticalListSortingStrategy}
          >
            {openRouterModels.map((model, index) => (
              <OpenRouterSortableItem
                key={model.uuid}
                uuid={model.uuid}
                index={index}
                model={model}
                onModelChange={handleModelChange}
                onRemoveModel={handleRemoveModel}
                activeKey={activeKey}
                setActiveKey={setActiveKey}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Button type='dashed' onClick={handleAddModel} block>
          Add Model
        </Button>
      </Space>
    </Form>
  );
};
