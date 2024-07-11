import React, { useContext, useEffect } from 'react';
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

import { ModelServiceType } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { ModelFormSortableItem } from './ModelForm/ModelFormSortableItem';

type ModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  activeModelService: ModelServiceType | 'loading...';
  availableModels: string[];
  setAvailableModels: React.Dispatch<React.SetStateAction<string[]>>;
  handleEditModelListSave: (models: string[]) => void;
};

export const ModelForm: React.FC<ModelFormProps> = ({
  isOpen,
  isLoading,
  activeModelService,
  availableModels,
  setAvailableModels,
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

  const handleSave = (modelsToSave: string[]) => {
    if (activeModelService === 'loading...' || isLoading) return;

    callApi('setAvailableModels', activeModelService, modelsToSave)
      .then(() => {
        callApi(
          'alertMessage',
          'Available models saved successfully',
          'info',
        ).catch(console.error);
        setTimeout(() => {
          handleEditModelListSave(modelsToSave);
        }, 200);
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to save available models: ${error}`,
          'error',
        ).catch(console.error);
      });
  };

  useEffect(() => {
    if (!isOpen) {
      handleSave(availableModels);
    }
  }, [isOpen]);

  const handleAvailableModelChange = (index: number, value: string) => {
    const updatedModels = [...availableModels];
    updatedModels[index] = value;
    setAvailableModels(updatedModels);
  };

  const handleAddAvailableModel = () => {
    setAvailableModels([...availableModels, '']);
  };

  const handleRemoveAvailableModel = (index: number) => {
    const updatedModels = availableModels.filter((_, i) => i !== index);
    setAvailableModels(updatedModels);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = availableModels.indexOf(active.id as string);
      const newIndex = availableModels.indexOf(over.id as string);

      setAvailableModels(arrayMove(availableModels, oldIndex, newIndex));
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
            items={availableModels}
            strategy={verticalListSortingStrategy}
          >
            {availableModels.map((model, index) => (
              <ModelFormSortableItem
                key={model}
                id={model}
                index={index}
                value={model}
                onChange={handleAvailableModelChange}
                onRemove={handleRemoveAvailableModel}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Button type='dashed' onClick={handleAddAvailableModel} block>
          Add Model
        </Button>
      </Space>
    </Form>
  );
};
