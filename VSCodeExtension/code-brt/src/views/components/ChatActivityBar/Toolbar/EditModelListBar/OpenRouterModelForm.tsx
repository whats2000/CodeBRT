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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
      void handleSave(openRouterModels);
    }
  }, [isOpen]);

  const handleSave = async (modelsToSave: OpenRouterModelSettings[]) => {
    if (isLoading) return;

    await callApi('setOpenRouterModels', modelsToSave)
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
        name: t('common:openRouterModelForm.newModel'),
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

  const handleAddModelFromBrowser = async (model: OpenRouterModelSettings) => {
    const existingModel = openRouterModels.find((m) => m.id === model.id);

    if (existingModel) {
      void messageApi.warning(t('common:openRouterModelForm.modelAlreadyInList', {name: model.name}));
      return;
    }

    const newModel: OpenRouterModelSettings = {
      ...model,
      uuid: uuidV4(),
      created: new Date().getTime(),
    };

    setOpenRouterModels([...openRouterModels, newModel]);
    await handleSave([...openRouterModels, newModel]);
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
          {t('common:openRouterModelForm.browseAvailableModels')}
        </Button>
        <Button type='dashed' onClick={handleAddModel} block={true}>
          {t('common:openRouterModelForm.addModelManually')}
        </Button>
        <OpenRouterModelBrowserModal
          isOpen={isBrowseModalOpen}
          onClose={() => setIsBrowseModalOpen(false)}
          onAddModel={handleAddModelFromBrowser}
          onRemoveModel={handleRemoveModel}
          openRouterModels={openRouterModels}
        />
      </Space>
    </Form>
  );
};
