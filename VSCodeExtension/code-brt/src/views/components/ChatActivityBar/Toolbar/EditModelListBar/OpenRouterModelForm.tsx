import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, message, Space } from 'antd';
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
import { OpenRouterModelBrowserModal } from './OpenRouterModelBrowserModal';

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
  const [messageApi, contextHolder] = message.useMessage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);

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
        created: new Date().getTime(),
        description: '',
        context_length: 4096,
        architecture: {
          modality: '',
          tokenizer: '',
          instruct_type: null,
        },
        pricing: {
          prompt: '',
          completion: '',
          image: '',
          request: '',
        },
        top_provider: {
          context_length: null,
          max_completion_tokens: null,
          is_moderated: null,
        },
        per_request_limits: null,
      },
    ]);
  };

  const handleAddModelFromBrowser = (model: OpenRouterModelSettings) => {
    const existingModel = openRouterModels.find((m) => m.id === model.id);

    if (existingModel) {
      void messageApi.warning(`Model ${model.name} is already in your list.`);
      return;
    }

    const newModel: OpenRouterModelSettings = {
      ...model,
      uuid: uuidV4(),
      apiKey: '', // User needs to add their API key
      created: new Date().getTime(),
    };

    setOpenRouterModels([...openRouterModels, newModel]);
    setIsBrowseModalOpen(false);
    void messageApi.success(`Added ${model.name} to your OpenRouter models.`);
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
      {contextHolder}
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
        <Button
          type={'primary'}
          ghost={true}
          block={true}
          onClick={() => setIsBrowseModalOpen(true)}
        >
          Browse Available Models
        </Button>
        <Button type='dashed' onClick={handleAddModel} block={true}>
          Add Model Manually
        </Button>
        <OpenRouterModelBrowserModal
          isOpen={isBrowseModalOpen}
          onClose={() => setIsBrowseModalOpen(false)}
          onAddModel={handleAddModelFromBrowser}
        />
      </Space>
    </Form>
  );
};
