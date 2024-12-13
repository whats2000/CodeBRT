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
import { useTranslation } from 'react-i18next';

import type { ModelServiceType } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { ModelFormSortableItem } from './ModelForm/ModelFormSortableItem';

type ModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  activeModelService: Exclude<ModelServiceType, 'custom'> | 'loading...';
  availableModels: {
    [key in `${Exclude<ModelServiceType, 'custom' | 'openRouter'>}AvailableModels`]: string[];
  };
  setNormalModels: (
    modelService: Exclude<ModelServiceType, 'custom' | 'openRouter'>,
    models: string[],
  ) => void;
  handleEditModelListSave: (models: string[]) => void;
  initialModelServiceRef: React.MutableRefObject<
    ModelServiceType | 'loading...'
  >;
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
  setNormalModels,
  handleEditModelListSave,
  initialModelServiceRef,
}) => {
  const { t } = useTranslation('common');
  if (
    activeModelService === 'openRouter' ||
    activeModelService === 'loading...'
  ) {
    return null;
  }

  const { callApi } = useContext(WebviewContext);

  const modelsWithId = useRef(
    availableModels[`${activeModelService}AvailableModels`].map((model) => ({
      id: uuidV4(),
      name: model,
    })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleSave = async (modelsToSave: ModelWithId[]) => {
    if (isLoading) return;

    await callApi(
      'setAvailableModels',
      activeModelService,
      modelsToSave.map((model) => model.name).filter((model) => model !== ''),
    )
      .then(() => {
        handleEditModelListSave(
          modelsToSave
            .map((model) => model.name)
            .filter((model) => model !== ''),
        );
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to save available models: ${error}`,
          'error',
        ).catch(console.error);
      });
  };

  // Save models only if service hasn't changed
  useEffect(() => {
    if (!isOpen) {
      // Only save if the service hasn't changed since the form was opened
      if (initialModelServiceRef.current === activeModelService) {
        void handleSave(modelsWithId.current);
      }

      // Reset the initial service ref
      initialModelServiceRef.current = 'loading...';
    }
  }, [isOpen, activeModelService]);

  const handleAvailableModelChange = (id: string, value: string) => {
    const updatedModels = modelsWithId.current.map((model) =>
      model.id === id ? { ...model, name: value } : model,
    );
    modelsWithId.current = updatedModels;
    setNormalModels(
      activeModelService,
      updatedModels.map((model) => model.name),
    );
  };

  const handleAddAvailableModel = () => {
    const newModel = { id: uuidV4(), name: '' };
    modelsWithId.current = [...modelsWithId.current, newModel];
    setNormalModels(
      activeModelService,
      modelsWithId.current.map((model) => model.name),
    );
  };

  const handleRemoveAvailableModel = (id: string) => {
    const updatedModels = modelsWithId.current.filter(
      (model) => model.id !== id,
    );
    modelsWithId.current = updatedModels;
    setNormalModels(
      activeModelService,
      updatedModels.map((model) => model.name),
    );
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
      setNormalModels(
        activeModelService,
        updatedModels.map((model) => model.name),
      );
    }
  };

  const handleFetchLatestAvailableModels = async () => {
    setIsLoading(true);

    const latestAvailableModels = (await callApi(
      'getLatestAvailableModelNames',
      activeModelService,
    )) as string[];

    setIsLoading(false);

    if (
      latestAvailableModels ===
      availableModels[`${activeModelService}AvailableModels`]
    )
      return;

    setNormalModels(activeModelService, latestAvailableModels);
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
        <Tooltip title={t('modelForm.removeOutdatedModelsNotice')}>
          <Button
            type='primary'
            ghost={true}
            onClick={handleFetchLatestAvailableModels}
            block
          >
            {activeModelService === 'ollama'
              ? t('modelForm.fetchOllamaModels')
              : t('modelForm.fetchLatestModels')}
          </Button>
        </Tooltip>
        <Button type='dashed' onClick={handleAddAvailableModel} block>
          {t('addModel')}
        </Button>
      </Space>
    </Form>
  );
};
