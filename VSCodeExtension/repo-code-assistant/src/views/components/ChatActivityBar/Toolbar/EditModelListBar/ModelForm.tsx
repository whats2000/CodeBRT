import React, { useContext, useEffect, useRef } from 'react';
import { Button, Form, Space, Tooltip } from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  PointerSensor,
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidV4 } from 'uuid';

import type { ModelServiceType } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { ModelFormSortableItem } from './ModelForm/ModelFormSortableItem';

type ModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  activeModelService: Exclude<ModelServiceType, 'custom'> | 'loading...';
  availableModels: string[];
  setAvailableModels: React.Dispatch<React.SetStateAction<string[]>>;
  handleEditModelListSave: (models: string[]) => void;
};

type ModelWithId = {
  id: string;
  name: string;
};

export const ModelForm: React.FC<ModelFormProps> = ({
  isOpen,
  isLoading,
  setIsLoading,
  activeModelService,
  availableModels,
  setAvailableModels,
  handleEditModelListSave,
}) => {
  const { callApi } = useContext(WebviewContext);

  const modelsWithId = useRef(
    availableModels.map((model) => ({ id: uuidV4(), name: model })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleSave = (modelsToSave: ModelWithId[]) => {
    if (activeModelService === 'loading...' || isLoading) return;

    callApi(
      'setAvailableModels',
      activeModelService,
      modelsToSave.map((model) => model.name).filter((model) => model !== ''),
    )
      .then(() => {
        callApi(
          'alertMessage',
          'Available models saved successfully',
          'info',
        ).catch(console.error);
        setTimeout(() => {
          handleEditModelListSave(
            modelsToSave
              .map((model) => model.name)
              .filter((model) => model !== ''),
          );
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
      handleSave(modelsWithId.current);
    }
  }, [isOpen]);

  const handleAvailableModelChange = (id: string, value: string) => {
    const updatedModels = modelsWithId.current.map((model) =>
      model.id === id ? { ...model, name: value } : model,
    );
    modelsWithId.current = updatedModels;
    setAvailableModels(updatedModels.map((model) => model.name));
  };

  const handleAddAvailableModel = () => {
    const newModel = { id: uuidV4(), name: '' };
    modelsWithId.current = [...modelsWithId.current, newModel];
    setAvailableModels(modelsWithId.current.map((model) => model.name));
  };

  const handleRemoveAvailableModel = (id: string) => {
    const updatedModels = modelsWithId.current.filter(
      (model) => model.id !== id,
    );
    modelsWithId.current = updatedModels;
    setAvailableModels(updatedModels.map((model) => model.name));
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
      setAvailableModels(updatedModels.map((model) => model.name));
    }
  };

  const handleFetchLatestAvailableModels = async () => {
    if (activeModelService === 'loading...') return;

    setIsLoading(true);

    const latestAvailableModels = (await callApi(
      'getLatestAvailableModelNames',
      activeModelService,
    )) as string[];

    setIsLoading(false);

    if (latestAvailableModels === availableModels) return;

    setAvailableModels(latestAvailableModels);
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
            {modelsWithId.current
              .filter(
                (model, index) =>
                  !(
                    activeModelService === 'ollama' &&
                    index === 0 &&
                    model.name === 'Auto Detect'
                  ),
              )
              .map((model, index) => (
                <ModelFormSortableItem
                  key={model.id}
                  id={model.id}
                  index={index}
                  value={model.name}
                  onChange={handleAvailableModelChange}
                  onRemove={handleRemoveAvailableModel}
                />
              ))}
          </SortableContext>
        </DndContext>
        <Tooltip title='Notice: This will also remove the outdated models from the list'>
          <Button
            type='primary'
            ghost={true}
            onClick={handleFetchLatestAvailableModels}
            block
          >
            {activeModelService === 'ollama'
              ? 'Fetch available models from host server'
              : 'Fetch Latest Available Models'}
          </Button>
        </Tooltip>
        <Button type='dashed' onClick={handleAddAvailableModel} block>
          Add Model
        </Button>
      </Space>
    </Form>
  );
};
