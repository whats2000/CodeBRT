import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Collapse,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
} from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';

import type { OpenRouterModelSettings } from '../../../../../../types';

type OpenRouterModelSortableItemProps = {
  uuid: string;
  index: number;
  model: OpenRouterModelSettings;
  onModelChange: (
    uuid: string,
    field: keyof OpenRouterModelSettings,
    value: any,
  ) => void;
  onRemoveModel: (uuid: string) => void;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
};

export const OpenRouterSortableItem: React.FC<
  OpenRouterModelSortableItemProps
> = ({
  uuid,
  model,
  onModelChange,
  onRemoveModel,
  activeKey,
  setActiveKey,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id: uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '8px',
  };

  // Fields that map directly to OpenRouterModelSettings
  const renderBasicFields = () => (
    <>
      <Divider orientation='left' orientationMargin={0}>
        <Typography.Text type={'secondary'}>Basic Information</Typography.Text>
      </Divider>
      <Form.Item
        label='Model ID'
        tooltip={
          'The model ID will usually be in the format of <organization>/<model-name>'
        }
      >
        <Input
          value={model.id}
          placeholder='e.g., openai/gpt-4o-mini'
          onChange={(e) => onModelChange(uuid, 'id', e.target.value)}
        />
      </Form.Item>
      <Form.Item label='Name' tooltip={'What ever you want to call the model'}>
        <Input
          value={model.name}
          placeholder='Friendly name for the model'
          onChange={(e) => onModelChange(uuid, 'name', e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label='API Key'
        tooltip={
          'The API key for the OpenRouter API you need provide even if the model is free.'
        }
      >
        <Input.Password
          value={model.apiKey}
          placeholder='OpenRouter API Key'
          onChange={(e) => onModelChange(uuid, 'apiKey', e.target.value)}
        />
      </Form.Item>
      <Form.Item label='Context Length' tooltip='Maximum number of tokens'>
        <InputNumber
          style={{ width: '100%' }}
          value={model.context_length}
          placeholder='Maximum context length'
          onChange={(value) => onModelChange(uuid, 'context_length', value)}
        />
      </Form.Item>
    </>
  );

  // Pricing-related fields
  const renderPricingFields = () => (
    <>
      <Divider orientation='left' orientationMargin={0}>
        <Typography.Text type={'secondary'}>
          Pricing Information
        </Typography.Text>
      </Divider>
      <Form.Item label='Prompt Price'>
        <Input
          value={model.pricing.prompt}
          placeholder='Price per 1M tokens for prompts'
          onChange={(e) =>
            onModelChange(uuid, 'pricing', {
              ...model.pricing,
              prompt: e.target.value,
            })
          }
        />
      </Form.Item>
      <Form.Item label='Completion Price'>
        <Input
          value={model.pricing.completion}
          placeholder='Price per 1M tokens for completions'
          onChange={(e) =>
            onModelChange(uuid, 'pricing', {
              ...model.pricing,
              completion: e.target.value,
            })
          }
        />
      </Form.Item>
      <Form.Item label='Image Price'>
        <Input
          value={model.pricing.image}
          placeholder='Price for image processing'
          onChange={(e) =>
            onModelChange(uuid, 'pricing', {
              ...model.pricing,
              image: e.target.value,
            })
          }
        />
      </Form.Item>
    </>
  );

  // Context and provider details
  const renderProviderFields = () => (
    <>
      <Divider orientation='left' orientationMargin={0}>
        <Typography.Text type={'secondary'}>
          Provider Information
        </Typography.Text>
      </Divider>
      <Form.Item
        label='Context Length'
        tooltip='Maximum number of tokens the model can process'
      >
        <InputNumber
          style={{ width: '100%' }}
          value={model.context_length}
          placeholder='Maximum context length'
          onChange={(value) => onModelChange(uuid, 'context_length', value)}
        />
      </Form.Item>
      <Form.Item
        label='Is Moderated'
        tooltip='Whether the model has content moderation'
      >
        <Select
          value={model.top_provider.is_moderated}
          placeholder='Moderation status'
          onChange={(value) =>
            onModelChange(uuid, 'top_provider', {
              ...model.top_provider,
              is_moderated: value,
            })
          }
          options={[
            { value: null, label: 'Not Specified' },
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
        />
      </Form.Item>
    </>
  );

  return (
    <Flex ref={setNodeRef} style={style} align={'center'}>
      <Button
        ref={setActivatorNodeRef}
        type='text'
        icon={<HolderOutlined />}
        style={{ cursor: 'move', marginRight: '8px' }}
        {...listeners}
        {...attributes}
      />
      <Collapse
        style={{ width: '100%' }}
        bordered={false}
        activeKey={activeKey}
        onChange={(keys) => setActiveKey(keys as string[])}
        items={[
          {
            key: uuid,
            label: model.name || 'New OpenRouter Model',
            children: (
              <>
                {renderBasicFields()}
                {renderPricingFields()}
                {renderProviderFields()}
              </>
            ),
            extra: (
              <Button
                danger={true}
                type='text'
                size='small'
                onClick={() => onRemoveModel(uuid)}
              >
                <DeleteOutlined style={{ cursor: 'pointer' }} />
              </Button>
            ),
          },
        ]}
      />
    </Flex>
  );
};
