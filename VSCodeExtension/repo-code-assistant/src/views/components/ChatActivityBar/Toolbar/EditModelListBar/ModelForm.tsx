import React, { useContext, useEffect } from 'react';
import { Button, Form, Input, List, Space } from 'antd';

import { ModelServiceType } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';

type ModelFormProps = {
  isOpen: boolean;
  isLoading: boolean;
  activeModelService: ModelServiceType | 'loading...';
  availableModels: string[];
  setAvailableModels: (models: string[]) => void;
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

  const handleSave = (modelsToSave: string[]) => {
    if (activeModelService === 'loading...' || isLoading) return;

    callApi('setAvailableModels', activeModelService, modelsToSave)
      .then(() => {
        callApi(
          'alertMessage',
          'Available models saved successfully',
          'info',
        ).catch(console.error);
        handleEditModelListSave(modelsToSave);
      })
      .catch((error: any) => {
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

  return (
    <Form layout='vertical'>
      <Space direction='vertical' style={{ width: '100%' }}>
        <List
          dataSource={availableModels}
          renderItem={(model, index) => (
            <List.Item
              actions={[
                <Button
                  danger
                  onClick={() => handleRemoveAvailableModel(index)}
                >
                  Remove
                </Button>,
              ]}
            >
              <Form.Item label={`Model ${index + 1}`}>
                <Input
                  value={model}
                  onChange={(e) =>
                    handleAvailableModelChange(index, e.target.value)
                  }
                />
              </Form.Item>
            </List.Item>
          )}
        />
        <Button type='dashed' onClick={handleAddAvailableModel} block>
          Add Model
        </Button>
      </Space>
    </Form>
  );
};
