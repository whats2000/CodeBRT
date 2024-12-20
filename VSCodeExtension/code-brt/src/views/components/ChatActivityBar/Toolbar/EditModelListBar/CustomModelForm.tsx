import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, Space } from 'antd';
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

import type { CustomModelSettings } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';
import { CustomModelSortableItem } from './CustomModelForm/CustomModelFormSortableItem';

type CustomModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  customModels: CustomModelSettings[];
  setCustomModels: React.Dispatch<React.SetStateAction<CustomModelSettings[]>>;
  handleEditModelListSave: (models: string[]) => void;
};

export const CustomModelForm: React.FC<CustomModelFormProps> = ({
  isOpen,
  isLoading,
  customModels,
  setCustomModels,
  handleEditModelListSave,
}) => {
  const { t } = useTranslation('common');
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
      handleSave(customModels);
    }
  }, [isOpen]);

  const handleSave = (modelsToSave: CustomModelSettings[]) => {
    if (isLoading) return;

    callApi('setCustomModels', modelsToSave)
      .then(() => {
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

  const handleAddModel = () => {
    let newName = `${t('model')} ${customModels.length + 1}`;
    if (customModels.some((model) => model.name === newName)) {
      newName = `${newName} (${customModels.filter((model) => model.name.includes(newName)).length})`;
    }
    const newModel: CustomModelSettings = {
      id: uuidV4(),
      name: newName,
      apiUrl: '',
      apiMethod: 'POST',
      apiTextParam: '',
      apiImageParam: '',
      apiQueryParam: '',
      includeQueryInHistory: true,
    };
    setCustomModels([...customModels, newModel]);
  };

  const handleModelChange = (
    id: string,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => {
    const updatedModels = customModels.map((model) => {
      if (model.id === id) {
        return { ...model, [field]: value };
      }
      return model;
    });
    setCustomModels(updatedModels);
  };

  const handleRemoveModel = (id: string) => {
    const updatedModels = customModels.filter((model) => model.id !== id);
    setCustomModels(updatedModels);
    setActiveKey(activeKey.filter((key) => key !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIndex = customModels.findIndex(
      (model) => model.id === active.id,
    );

    const overIndex = customModels.findIndex((model) => model.id === over.id);

    if (activeIndex !== overIndex) {
      const updatedModels = arrayMove(customModels, activeIndex, overIndex);
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
            items={customModels.map((model) => model.id)}
            strategy={verticalListSortingStrategy}
          >
            {customModels.map((model, index) => (
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
          {t('addModel')}
        </Button>
      </Space>
    </Form>
  );
};
