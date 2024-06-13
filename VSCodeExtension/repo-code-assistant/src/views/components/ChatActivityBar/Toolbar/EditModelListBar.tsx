import React, { useContext, useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  Checkbox,
  Space,
  Collapse,
  List,
} from 'antd';
import { WebviewContext } from '../../../WebviewContext';
import { CustomModelSettings } from '../../../../types/extensionSettings';
import { ModelType } from '../../../../types/modelType';

const { Option } = Select;
const { Panel } = Collapse;

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
  const [isModelListLoading, setIsModelListLoading] = useState(false);

  useEffect(() => {
    setIsModelListLoading(true);
    if (activeModel === 'loading...') return;

    if (isOpen) {
      if (activeModel === 'custom') {
        callApi('getCustomModels')
          .then((models: CustomModelSettings[]) => {
            setCustomModels(models);
            setIsModelListLoading(false);
          })
          .catch((error: any) => {
            callApi(
              'alertMessage',
              `Failed to load custom models: ${error}`,
              'error',
            ).catch(console.error);
            setIsModelListLoading(false);
          });
      } else {
        callApi('getAvailableModels', activeModel)
          .then((models: string[]) => {
            setAvailableModels(models);
            setIsModelListLoading(false);
          })
          .catch((error: any) => {
            callApi(
              'alertMessage',
              `Failed to load available models: ${error}`,
              'error',
            ).catch(console.error);
            setIsModelListLoading(false);
          });
      }
    }
  }, [isOpen, activeModel]);

  const handleSave = () => {
    if (activeModel === 'loading...') return;

    if (activeModel === 'custom') {
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
    } else {
      callApi('setAvailableModels', activeModel, availableModels)
        .then(() => {
          callApi(
            'alertMessage',
            'Available models saved successfully',
            'info',
          ).catch(console.error);
          handleEditModelListSave(availableModels);
          onClose();
        })
        .catch((error: any) => {
          callApi(
            'alertMessage',
            `Failed to save available models: ${error}`,
            'error',
          ).catch(console.error);
        });
    }
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
    callApi('deleteCustomModel', customModels[index].name)
      .then(() => {
        setCustomModels(updatedModels);
      })
      .catch((error: any) => {
        callApi(
          'alertMessage',
          `Failed to delete custom model: ${error}`,
          'error',
        ).catch(console.error);
      });
  };

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
    <Drawer
      title='Edit Available Models'
      placement='right'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isModelListLoading}
    >
      {activeModel === 'custom' ? (
        <Form layout='vertical'>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse bordered={false} size={'large'}>
              {customModels.map((model, index) => (
                <Panel
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
                      <Option value='GET'>GET</Option>
                      <Option value='POST'>POST</Option>
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
                        handleModelChange(
                          index,
                          'apiImageParam',
                          e.target.value,
                        )
                      }
                    />
                  </Form.Item>
                  <Form.Item label='Query Parameter'>
                    <Input
                      value={model.apiQueryParam}
                      onChange={(e) =>
                        handleModelChange(
                          index,
                          'apiQueryParam',
                          e.target.value,
                        )
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
                </Panel>
              ))}
            </Collapse>
            <Button type='dashed' onClick={handleAddModel} block>
              Add Model
            </Button>
            <Button type='primary' onClick={handleSave} block>
              Save
            </Button>
          </Space>
        </Form>
      ) : (
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
            <Button type='primary' onClick={handleSave} block>
              Save
            </Button>
          </Space>
        </Form>
      )}
    </Drawer>
  );
};
