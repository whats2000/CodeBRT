import React, { useContext, useEffect, useState } from 'react';
import { Drawer } from 'antd';

import type { CustomModelSettings, ModelType } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { ModelForm } from './EditModelListBar/ModelForm';
import { CustomModelForm } from './EditModelListBar/CustomModelForm';

interface EditModelListBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType | 'loading...';
  handleEditModelListSave: (models: string[]) => void;
}

export const EditModelListBar: React.FC<EditModelListBarProps> = ({
  isOpen,
  onClose,
  activeModel,
  handleEditModelListSave,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [customModels, setCustomModels] = useState<CustomModelSettings[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (activeModel === 'loading...') return;

    if (isOpen) {
      if (activeModel === 'custom') {
        callApi('getCustomModels')
          .then((models: CustomModelSettings[]) => {
            setCustomModels(models);
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
        callApi('getAvailableModels', activeModel)
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
  }, [isOpen, activeModel]);

  return (
    <Drawer
      title='Edit Available Models'
      placement='right'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      {activeModel === 'custom' ? (
        <CustomModelForm
          activeModel={activeModel}
          customModels={customModels}
          setCustomModels={setCustomModels}
          handleEditModelListSave={handleEditModelListSave}
          onClose={onClose}
        />
      ) : (
        <ModelForm
          activeModel={activeModel}
          availableModels={availableModels}
          setAvailableModels={setAvailableModels}
          handleEditModelListSave={handleEditModelListSave}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
};
