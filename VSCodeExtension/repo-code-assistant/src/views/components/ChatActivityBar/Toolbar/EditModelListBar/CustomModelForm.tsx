import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form, Space } from 'antd';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';

import type {
  CustomModelSettings,
  ModelServiceType,
} from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { CustomModelSortableItem } from './CustomModelForm/CustomModelFormSortableItem';

type CustomModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  activeModel: ModelServiceType | 'loading...';
  customModels: CustomModelSettings[];
  setCustomModels: React.Dispatch<React.SetStateAction<CustomModelSettings[]>>;
  handleEditModelListSave: (models: string[]) => void;
};

type CustomModelWithId = CustomModelSettings & { id: string };

export const CustomModelForm: React.FC<CustomModelFormProps> = ({
  isOpen,
  isLoading,
  activeModel,
  customModels,
  setCustomModels,
  handleEditModelListSave,
}) => {
  const { callApi } = useContext(WebviewContext);
  const modelsWithId = useRef(
    customModels.map((model) => ({ ...model, id: uuidv4() })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [activeKey, setActiveKey] = useState<string[]>([]);

  const handleSave = (modelsToSave: CustomModelWithId[]) => {
    if (activeModel === 'loading...' || isLoading) return;

    callApi(
      'setCustomModels',
      modelsToSave.map((model) => {
        const { id, ...rest } = model;
        return rest;
      }),
    )
      .then(() => {
        callApi(
          'alertMessage',
          'Custom models saved successfully',
          'info',
        ).catch(console.error);
        handleEditModelListSave(modelsToSave.map((model) => model.name));
      })
      .catch((error: any) => {
        callApi(
          'alertMessage',
          `Failed to save custom models: ${error}`,
          'error',
        ).catch(console.error);
      });
  };

  useEffect(() => {
    if (!isOpen) {
      handleSave(modelsWithId.current);
    }
  }, [isOpen]);

  const handleAddModel = () => {
    const newModel: CustomModelWithId = {
      id: uuidv4(),
      name: '',
      apiUrl: '',
      apiMethod: 'POST',
      apiTextParam: '',
      apiImageParam: '',
      apiQueryParam: '',
      includeQueryInHistory: true,
    };
    modelsWithId.current = [...modelsWithId.current, newModel];
    setCustomModels(modelsWithId.current);
  };

  const handleModelChange = (
    id: string,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => {
    const updatedModels = modelsWithId.current.map((model) =>
      model.id === id ? { ...model, [field]: value } : model,
    );
    modelsWithId.current = updatedModels;
    setCustomModels(updatedModels);
  };

  const handleRemoveModel = (id: string) => {
    const updatedModels = modelsWithId.current.filter(
      (model) => model.id !== id,
    );
    modelsWithId.current = updatedModels;
    setCustomModels(updatedModels);
    setActiveKey(activeKey.filter((key) => key !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex = modelsWithId.current.findIndex(
      (model) => model.id === active.id,
    );
    const overIndex = modelsWithId.current.findIndex(
      (model) => model.id === over.id,
    );

    if (activeIndex !== overIndex) {
      const updatedModels = arrayMove(
        modelsWithId.current,
        activeIndex,
        overIndex,
      );
      modelsWithId.current = updatedModels;
      setCustomModels(updatedModels);
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
            items={modelsWithId.current.map((model) => model.id)}
            strategy={verticalListSortingStrategy}
          >
            {modelsWithId.current.map((model, index) => (
              <CustomModelSortableItem
                key={model.id}
                id={model.id}
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
