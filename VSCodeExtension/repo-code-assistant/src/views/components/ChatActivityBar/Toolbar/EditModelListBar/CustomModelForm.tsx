import React, { useContext, useEffect, useState } from 'react';
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
import type {
  CustomModelSettings,
  ModelServiceType,
} from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { SortableItem } from './CustomModelForm/CustomModelFormSortableItem';

type CustomModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  activeModel: ModelServiceType | 'loading...';
  customModels: CustomModelSettings[];
  setCustomModels: React.Dispatch<React.SetStateAction<CustomModelSettings[]>>;
  handleEditModelListSave: (models: string[]) => void;
};

export const CustomModelForm: React.FC<CustomModelFormProps> = ({
  isOpen,
  isLoading,
  activeModel,
  customModels,
  setCustomModels,
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

  const handleSave = (modelsToSave: CustomModelSettings[]) => {
    if (activeModel === 'loading...' || isLoading) return;

    callApi('setCustomModels', modelsToSave)
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
      handleSave(customModels);
    }
  }, [isOpen]);

  const handleAddModel = () => {
    setCustomModels([
      ...customModels,
      {
        name: 'New Model',
        apiUrl: '',
        apiMethod: 'POST',
        apiTextParam: '',
        apiImageParam: '',
        apiQueryParam: '',
        includeQueryInHistory: true,
      },
    ]);
  };

  const handleModelChange = (
    index: number,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => {
    setCustomModels((prevModels) => {
      const updatedModels = [...prevModels];
      updatedModels[index][field] = value as never;
      return updatedModels;
    });
  };

  const handleRemoveModel = (index: number) => {
    const updatedModels = customModels.filter((_, i) => i !== index);
    setCustomModels(updatedModels);
    setActiveKey(activeKey.filter((key) => key !== index.toString()));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = customModels.findIndex(
        (_, index) => `custom-model-${index}` === active.id,
      );
      const newIndex = customModels.findIndex(
        (_, index) => `custom-model-${index}` === over.id,
      );

      setCustomModels(arrayMove(customModels, oldIndex, newIndex));
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
            items={customModels.map((_, index) => `custom-model-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            {customModels.map((model, index) => (
              <SortableItem
                key={`custom-model-${index}`}
                id={`custom-model-${index}`}
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
