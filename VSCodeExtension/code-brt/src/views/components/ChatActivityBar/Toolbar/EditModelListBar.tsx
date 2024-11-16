import React, { useEffect, useState } from 'react';
import { Drawer } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type {
  CustomModelSettings,
  OpenRouterModelSettings,
} from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { ModelForm } from './EditModelListBar/ModelForm';
import { CustomModelForm } from './EditModelListBar/CustomModelForm';
import { updateAvailableModels } from '../../../redux/slices/modelServiceSlice';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';
import { OpenRouterModelForm } from './EditModelListBar/OpenRouterModelForm';
import { v4 as uuidV4 } from 'uuid';

type EditModelListBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const EditModelListBar: React.FC<EditModelListBarProps> = ({
  isOpen,
  onClose,
}) => {
  const [customModels, setCustomModels] = useState<CustomModelSettings[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<
    OpenRouterModelSettings[]
  >([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch<AppDispatch>();

  const activeModelService = useSelector(
    (state: RootState) => state.modelService.activeModelService,
  );

  const { settings } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    setIsLoading(true);
    if (activeModelService === 'loading...') return;

    if (isOpen) {
      if (activeModelService === 'custom') {
        setCustomModels(settings.customModels);
      } else if (activeModelService === 'openRouter') {
        setOpenRouterModels(
          settings.openRouterModels.map((modelSettings) => ({
            ...{
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
            ...modelSettings,
          })),
        );
      } else {
        setAvailableModels(settings[`${activeModelService}AvailableModels`]);
      }
      setIsLoading(false);
    }
  }, [isOpen, activeModelService]);

  const handleEditModelListSave = (newAvailableModels: string[]) => {
    if (activeModelService === 'loading...') return;

    dispatch(
      updateAvailableModels({
        modelType: activeModelService,
        newAvailableModels,
      }),
    );

    if (activeModelService === 'custom') {
      dispatch(
        updateAndSaveSetting({
          key: 'customModels',
          value: customModels,
        }),
      );
      return;
    }

    if (activeModelService === 'openRouter') {
      dispatch(
        updateAndSaveSetting({
          key: 'openRouterModels',
          value: openRouterModels,
        }),
      );
      return;
    }

    dispatch(
      updateAndSaveSetting({
        key: `${activeModelService}AvailableModels`,
        value: newAvailableModels,
      }),
    );
  };

  return (
    <Drawer
      title='Edit Available Models'
      placement='right'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      {activeModelService === 'custom' ? (
        <CustomModelForm
          isOpen={isOpen}
          isLoading={isLoading}
          customModels={customModels}
          setCustomModels={setCustomModels}
          handleEditModelListSave={handleEditModelListSave}
        />
      ) : activeModelService === 'openRouter' ? (
        <OpenRouterModelForm
          isOpen={isOpen}
          isLoading={isLoading}
          openRouterModels={openRouterModels}
          setOpenRouterModels={setOpenRouterModels}
          handleEditModelListSave={handleEditModelListSave}
        />
      ) : (
        <ModelForm
          isOpen={isOpen}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          activeModelService={activeModelService}
          availableModels={availableModels}
          setAvailableModels={setAvailableModels}
          handleEditModelListSave={handleEditModelListSave}
        />
      )}
    </Drawer>
  );
};
