import React, { useEffect, useState } from 'react';
import { Drawer } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { CustomModelSettings } from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { ModelForm } from './EditModelListBar/ModelForm';
import { CustomModelForm } from './EditModelListBar/CustomModelForm';
import { updateAvailableModels } from '../../../redux/slices/modelServiceSlice';

type EditModelListBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const EditModelListBar: React.FC<EditModelListBarProps> = ({
  isOpen,
  onClose,
}) => {
  const [customModels, setCustomModels] = useState<CustomModelSettings[]>([]);
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
      setCustomModels(settings.customModels);

      if (activeModelService !== 'custom') {
        setAvailableModels(settings[`${activeModelService}AvailableModels`]);
      }
    }
  }, [isOpen, activeModelService]);

  const handleEditModelListSave = (newAvailableModels: string[]) => {
    dispatch(
      updateAvailableModels({
        modelType: activeModelService,
        newAvailableModels,
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
