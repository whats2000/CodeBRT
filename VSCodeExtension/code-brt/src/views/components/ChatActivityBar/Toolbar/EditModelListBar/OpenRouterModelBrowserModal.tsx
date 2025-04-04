import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  Input,
  Tag,
  Typography,
  Space,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Tooltip,
  Flex,
  Checkbox,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  PlusCircleOutlined,
  InfoCircleFilled,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Virtuoso } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';

import { WebviewContext } from '../../../../WebviewContext';
import type { OpenRouterModelSettings } from '../../../../../types';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

type OpenRouterModelBrowserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: OpenRouterModelSettings) => void;
  onRemoveModel: (uuid: string) => void;
  openRouterModels: OpenRouterModelSettings[];
};

export const OpenRouterModelBrowserModal: React.FC<
  OpenRouterModelBrowserModalProps
> = ({ isOpen, onClose, onAddModel, onRemoveModel, openRouterModels }) => {
  const { t } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);
  const [models, setModels] = useState<OpenRouterModelSettings[]>([]);
  const [filteredModels, setFilteredModels] = useState<
    OpenRouterModelSettings[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    modality?: string;
    instruct_type?: string;
    min_context_length?: number;
    isFree?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showInfoId, setShowInfoId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchAvailableModels();
    }
  }, [isOpen]);

  useEffect(() => {
    let result = models;

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(searchTermLower) ||
          model.id.toLowerCase().includes(searchTermLower),
      );
    }

    const { modality, instruct_type, min_context_length } = filters;

    if (modality) {
      result = result.filter(
        (model) =>
          model.architecture.modality.toLowerCase() === modality.toLowerCase(),
      );
    }

    if (instruct_type) {
      result = result.filter(
        (model) => model.architecture.instruct_type === instruct_type,
      );
    }

    if (min_context_length) {
      result = result.filter(
        (model) => model.context_length >= min_context_length,
      );
    }

    if (filters.isFree) {
      result = result.filter(
        (model) =>
          parseFloat(model.pricing.prompt) === 0.0 &&
          parseFloat(model.pricing.completion) === 0.0,
      );
    }

    setFilteredModels(result);
  }, [searchTerm, filters, models]);

  const fetchAvailableModels = async () => {
    setLoading(true);
    try {
      const availableModels = await callApi('getLatestAvailableModels');
      setModels(availableModels);
      setFilteredModels(availableModels);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatToken = (token: number) => {
    if (token >= 1000000) {
      return `${(token / 1000000).toFixed(1)}M`;
    } else if (token >= 1000) {
      return `${(token / 1000).toFixed(1)}K`;
    } else {
      return token;
    }
  };

  const modalFooter = [
    <Button key='back' onClick={onClose}>
      {t('cancel')}
    </Button>,
  ];

  const renderAddOrRemoveButton = (model: OpenRouterModelSettings) => {
    const targetModel = openRouterModels.find((m) => m.id === model.id);
    if (!targetModel) {
      return (
        <Button
          type='primary'
          ghost={true}
          size={'small'}
          icon={<PlusCircleOutlined />}
          onClick={() => onAddModel(model)}
        >
          {t('addModel')}
        </Button>
      );
    }

    return (
      <Button
        danger={true}
        size={'small'}
        icon={<MinusCircleOutlined />}
        onClick={() => onRemoveModel(targetModel.uuid)}
      >
        {t('removeModel')}
      </Button>
    );
  };

  return (
    <Modal
      title={t('openRouterModelBrowserModal.browseModelsTitle', {
        count: filteredModels.length,
      })}
      loading={loading}
      open={isOpen}
      onCancel={onClose}
      footer={modalFooter}
      width='90%'
    >
      <Space direction='vertical' style={{ width: '100%' }} wrap={true}>
        <Flex style={{ width: '100%' }} wrap={'wrap'} gap={10}>
          <Space wrap={true}>
            <Input
              placeholder={t('openRouterModelBrowserModal.searchModels')}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
            <Checkbox
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, isFree: e.target.checked }))
              }
            >
              <Text type='secondary'>
                {t('openRouterModelBrowserModal.free')}
              </Text>
            </Checkbox>
          </Space>
          <Space wrap={true}>
            <Select
              placeholder={t('openRouterModelBrowserModal.modality')}
              style={{ width: 150 }}
              allowClear
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, modality: value }))
              }
              options={[
                ...new Set(
                  models
                    .map((model) => model.architecture.modality)
                    .filter((modality) => modality),
                ),
              ].map((modality) => ({ value: modality, label: modality }))}
            />
            <Select
              placeholder={t('openRouterModelBrowserModal.instructType')}
              style={{ width: 150 }}
              allowClear
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, instruct_type: value }))
              }
              options={[
                ...new Set(
                  models
                    .map((model) => model.architecture.instruct_type)
                    .filter((type) => type),
                ),
              ].map((type) => ({ value: type, label: type }))}
            />
            <Select
              placeholder={t('openRouterModelBrowserModal.minContextLength')}
              style={{ width: '100%' }}
              allowClear
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, min_context_length: value }))
              }
              options={[
                { value: 4096, label: '4K' },
                { value: 8192, label: '8K' },
                { value: 16384, label: '16K' },
                { value: 32768, label: '32K' },
                { value: 65536, label: '64K' },
                { value: 131072, label: '128K' },
              ]}
            />
          </Space>
        </Flex>
        <div style={{ height: '350px', overflow: 'auto' }}>
          <Virtuoso
            data={filteredModels}
            itemContent={(index, model) => (
              <>
                {index > 0 && <Divider style={{ marginTop: 10 }} />}
                <Row style={{ width: '100%' }} wrap={true} gutter={10}>
                  <Col xs={24} sm={12} style={{ marginBottom: 10 }}>
                    <Space direction={'vertical'}>
                      <Space>
                        <Text strong>{model.name}</Text>
                        <Button
                          icon={<InfoCircleFilled />}
                          type='text'
                          onClick={() =>
                            showInfoId === model.id
                              ? setShowInfoId(null)
                              : setShowInfoId(model.id)
                          }
                        />
                      </Space>
                      <Text type='secondary'>{model.id}</Text>
                      <Space wrap={true}>
                        <Tag color='blue'>{model.architecture.modality}</Tag>
                        <Tag color='green'>
                          {model.architecture.instruct_type ||
                            t('openRouterModelBrowserModal.notApplicable')}
                        </Tag>
                      </Space>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} style={{ marginBottom: 10 }}>
                    <Space direction={'vertical'}>
                      <Text>
                        {t('openRouterModelBrowserModal.maxTokens', {
                          token: formatToken(model.context_length),
                        })}
                      </Text>
                      <Text>
                        <Tooltip
                          title={t(
                            'openRouterModelBrowserModal.priceForPrompt',
                          )}
                        >
                          {model.pricing.prompt}
                        </Tooltip>{' '}
                        /{' '}
                        <Tooltip
                          title={t(
                            'openRouterModelBrowserModal.priceForCompletion',
                          )}
                        >
                          {model.pricing.completion}
                        </Tooltip>{' '}
                        {t('openRouterModelBrowserModal.perMillionTokens')}
                      </Text>
                      {renderAddOrRemoveButton(model)}
                    </Space>
                  </Col>
                </Row>
                {showInfoId === model.id && (
                  <Row style={{ width: '100%' }}>
                    <Col span={24}>
                      <Alert
                        message={
                          <ReactMarkdown>{model.description}</ReactMarkdown>
                        }
                        onClose={() => setShowInfoId(null)}
                      />
                    </Col>
                  </Row>
                )}
              </>
            )}
          />
        </div>
      </Space>
    </Modal>
  );
};
