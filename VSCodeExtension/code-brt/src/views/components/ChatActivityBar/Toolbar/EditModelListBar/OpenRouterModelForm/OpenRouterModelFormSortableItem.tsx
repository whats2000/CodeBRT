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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
        <Typography.Text type={'secondary'}>
          {t('openRouterModelFormSortableItem.basicInformation')}
        </Typography.Text>
      </Divider>
      <Form.Item
        label={t('openRouterModelFormSortableItem.modelId')}
        tooltip={t('openRouterModelFormSortableItem.modelIdTooltip')}
      >
        <Input
          value={model.id}
          placeholder={t('openRouterModelFormSortableItem.modelIdPlaceholder')}
          onChange={(e) => onModelChange(uuid, 'id', e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label={t('name')}
        tooltip={t('openRouterModelFormSortableItem.nameTooltip')}
      >
        <Input
          value={model.name}
          placeholder={t('openRouterModelFormSortableItem.namePlaceholder')}
          onChange={(e) => onModelChange(uuid, 'name', e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label={t('openRouterModelFormSortableItem.contextLength')}
        tooltip={t('openRouterModelFormSortableItem.contextLengthTooltip')}
      >
        <InputNumber
          style={{ width: '100%' }}
          value={model.context_length}
          placeholder={t(
            'openRouterModelFormSortableItem.contextLengthPlaceholder',
          )}
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
          {t('openRouterModelFormSortableItem.pricingInformation')}
        </Typography.Text>
      </Divider>
      <Form.Item label={t('openRouterModelFormSortableItem.promptPrice')}>
        <Input
          value={model.pricing.prompt}
          placeholder={t(
            'openRouterModelFormSortableItem.promptPricePlaceholder',
          )}
          onChange={(e) =>
            onModelChange(uuid, 'pricing', {
              ...model.pricing,
              prompt: e.target.value,
            })
          }
        />
      </Form.Item>
      <Form.Item label={t('openRouterModelFormSortableItem.completionPrice')}>
        <Input
          value={model.pricing.completion}
          placeholder={t(
            'openRouterModelFormSortableItem.completionPricePlaceholder',
          )}
          onChange={(e) =>
            onModelChange(uuid, 'pricing', {
              ...model.pricing,
              completion: e.target.value,
            })
          }
        />
      </Form.Item>
      <Form.Item label={t('openRouterModelFormSortableItem.imagePrice')}>
        <Input
          value={model.pricing.image}
          placeholder={t(
            'openRouterModelFormSortableItem.imagePricePlaceholder',
          )}
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
          {t('openRouterModelFormSortableItem.providerInformation')}
        </Typography.Text>
      </Divider>
      <Form.Item
        label={t('openRouterModelFormSortableItem.contextLength')}
        tooltip={t(
          'openRouterModelFormSortableItem.providerContextLengthTooltip',
        )}
      >
        <InputNumber
          style={{ width: '100%' }}
          value={model.context_length}
          placeholder={t(
            'openRouterModelFormSortableItem.contextLengthPlaceholder',
          )}
          onChange={(value) => onModelChange(uuid, 'context_length', value)}
        />
      </Form.Item>
      <Form.Item
        label={t('openRouterModelFormSortableItem.isModerated')}
        tooltip={t('openRouterModelFormSortableItem.isModeratedTooltip')}
      >
        <Select
          value={model.top_provider.is_moderated}
          placeholder={t('openRouterModelFormSortableItem.moderationStatus')}
          onChange={(value) =>
            onModelChange(uuid, 'top_provider', {
              ...model.top_provider,
              is_moderated: value,
            })
          }
          options={[
            {
              value: null,
              label: t('openRouterModelFormSortableItem.notSpecified'),
            },
            { value: true, label: t('yes') },
            { value: false, label: t('no') },
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
            label:
              model.name ||
              t('openRouterModelFormSortableItem.newOpenRouterModel'),
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
