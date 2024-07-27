import React, { useContext, useEffect, useState } from 'react';
import { Drawer } from 'antd';

import type { CustomModelSettings, ModelServiceType } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { ModelForm } from './EditModelListBar/ModelForm';
import { CustomModelForm } from './EditModelListBar/CustomModelForm';

type EditModelListBarProps = {
  isOpen: boolean;
  onClose: () => void;
  activeModelService: ModelServiceType | 'loading...';
  handleEditModelListSave: (models: string[]) => void;
};

export const EditModelListBar: React.FC<EditModelListBarProps> = ({
  isOpen,
  onClose,
  activeModelService,
  handleEditModelListSave,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [customModels, setCustomModels] = useState<CustomModelSettings[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (activeModelService === 'loading...') return;

    if (isOpen) {
      if (activeModelService === 'custom') {
        callApi('getSetting', 'customModels')
          .then((models) => {
            setCustomModels(models as CustomModelSettings[]);
            setIsLoading(false);
          })
          .catch((error: any) => {
            callApi(
              'alertMessage',
              `Failed to load custom models: ${error}`,
              'error',
            ).catch(console.error);
            setIsLoading(false);
          });
      } else {
        callApi('getAvailableModels', activeModelService)
          .then((models: string[]) => {
            setAvailableModels(models);
            setIsLoading(false);
          })
          .catch((error: any) => {
            callApi(
              'alertMessage',
              `Failed to load available models: ${error}`,
              'error',
            ).catch(console.error);
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, activeModelService]);

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
