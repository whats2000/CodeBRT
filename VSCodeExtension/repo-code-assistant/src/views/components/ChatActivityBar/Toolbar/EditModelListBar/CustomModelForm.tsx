import React, { useContext } from 'react';
import { Button, Checkbox, Collapse, Form, Input, Select, Space } from 'antd';

import type { CustomModelSettings, ModelType } from '../../../../../types';
import { WebviewContext } from '../../../../WebviewContext';

type CustomModelFormProps = {
  activeModel: ModelType | 'loading...';
  customModels: CustomModelSettings[];
  setCustomModels: (models: CustomModelSettings[]) => void;
  handleEditModelListSave: (models: string[]) => void;
  onClose: () => void;
};

export const CustomModelForm: React.FC<CustomModelFormProps> = ({
  activeModel,
  customModels,
  setCustomModels,
  handleEditModelListSave,
  onClose,
}) => {
  const { callApi } = useContext(WebviewContext);

  const handleSave = () => {
    if (activeModel === 'loading...') return;

    callApi('setCustomModels', customModels)
      .then(() => {
        callApi(
          'alertMessage',
          'Custom models saved successfully',
          'info',
        ).catch(console.error);
        handleEditModelListSave(customModels.map((model) => model.name));
        onClose();
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
    setCustomModels([
      ...customModels,
      {
        name: '',
        apiUrl: '',
        apiMethod: 'POST',
        apiTextParam: '',
        apiImageParam: '',
        apiQueryParam: '',
        includeQueryInHistory: true,
      },
    ]);
  };

  const handleModelChange = (
    index: number,
    field: keyof CustomModelSettings,
    value: string | boolean,
  ) => {
    const updatedModels = [...customModels];
    updatedModels[index][field] = value as never;
    setCustomModels(updatedModels);
  };

  const handleRemoveModel = (index: number) => {
    const updatedModels = customModels.filter((_, i) => i !== index);
    setCustomModels(updatedModels);
  };

  return (
    <Form layout='vertical'>
      <Space direction='vertical' style={{ width: '100%' }}>
        <Collapse bordered={false} size={'large'}>
          {customModels.map((model, index) => (
            <Collapse.Panel
              header={model.name || 'New Model'}
              key={index.toString()}
              extra={
                <Button danger onClick={() => handleRemoveModel(index)}>
                  Remove
                </Button>
              }
            >
              <Form.Item label='Name'>
                <Input
                  value={model.name}
                  onChange={(e) =>
                    handleModelChange(index, 'name', e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label='API URL'>
                <Input
                  value={model.apiUrl}
                  onChange={(e) =>
                    handleModelChange(index, 'apiUrl', e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label='API Method'>
                <Select
                  value={model.apiMethod}
                  onChange={(value) =>
                    handleModelChange(index, 'apiMethod', value)
                  }
                >
                  <Select.Option value='GET'>GET</Select.Option>
                  <Select.Option value='POST'>POST</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label='Text Parameter'>
                <Input
                  value={model.apiTextParam}
                  onChange={(e) =>
                    handleModelChange(index, 'apiTextParam', e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label='Image Parameter'>
                <Input
                  value={model.apiImageParam}
                  onChange={(e) =>
                    handleModelChange(index, 'apiImageParam', e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label='Query Parameter'>
                <Input
                  value={model.apiQueryParam}
                  onChange={(e) =>
                    handleModelChange(index, 'apiQueryParam', e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label='Include Query in History'>
                <Checkbox
                  checked={model.includeQueryInHistory}
                  onChange={(e) =>
                    handleModelChange(
                      index,
                      'includeQueryInHistory',
                      e.target.checked,
                    )
                  }
                />
              </Form.Item>
            </Collapse.Panel>
          ))}
        </Collapse>
        <Button type='dashed' onClick={handleAddModel} block>
          Add Model
        </Button>
        <Button type='primary' ghost={true} onClick={handleSave} block>
          Save
        </Button>
      </Space>
    </Form>
  );
};
