import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CheckboxProps } from 'antd/es/checkbox';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Form,
  Select,
  SelectProps,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import {
  QuestionCircleFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import type {
  CodeCompletionSettings,
  ExtensionSettings,
  ModelServiceType,
} from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { WebviewContext } from '../../../WebviewContext';
import { AVAILABLE_MODEL_SERVICES } from '../../../../constants';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled(Form.Item)`
  margin-bottom: 15px;
`;

type CodeCompletionSettingsBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CodeCompletionSettingsBar: React.FC<
  CodeCompletionSettingsBarProps
> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);
  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings } = useSelector(
    (state: RootState) => state.settings,
  );

  const [showMoreInfo, setShowMoreInfo] = useState<
    keyof CodeCompletionSettings | null
  >(null);
  const [isAvailableModelLoading, setIsAvailableModelLoading] = useState(false);
  const [
    availableManualCodeCompletionModels,
    setAvailableManualCodeCompletionModels,
  ] = useState<string[]>([]);
  const [
    availableAutoCodeCompletionModels,
    setAvailableAutoCodeCompletionModels,
  ] = useState<string[]>([]);

  const modelServiceOptions: SelectProps['options'] =
    AVAILABLE_MODEL_SERVICES.map((service) => ({
      key: service,
      label: service,
      value: service,
    }));

  useEffect(() => {
    setIsAvailableModelLoading(true);
    callApi(
      'getAvailableModels',
      settings.lastUsedManualCodeCompletionModelService,
    )
      .then((models) => {
        setAvailableManualCodeCompletionModels(models);
        setIsAvailableModelLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsAvailableModelLoading(false);
      });
  }, [settings.lastUsedManualCodeCompletionModelService, dispatch]);

  useEffect(() => {
    setIsAvailableModelLoading(true);
    callApi(
      'getAvailableModels',
      settings.lastUsedAutoCodeCompletionModelService,
    )
      .then((models) => {
        setAvailableAutoCodeCompletionModels(models);
        setIsAvailableModelLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsAvailableModelLoading(false);
      });
  }, [settings.lastUsedAutoCodeCompletionModelService, dispatch]);

  const handleCheckboxChange =
    (key: keyof ExtensionSettings): CheckboxProps['onChange'] =>
    (e) => {
      const value = e.target.checked;
      dispatch(updateAndSaveSetting({ key, value }));
    };

  const handleSelectChange =
    (key: keyof ExtensionSettings) => (value: string) => {
      dispatch(updateAndSaveSetting({ key, value }));
    };

  const handleModelSelectChange = (
    key: keyof ExtensionSettings,
    modelService: ModelServiceType,
    modelName: string,
  ) => {
    dispatch(
      updateAndSaveSetting({
        key,
        value: {
          ...settings[key],
          [modelService]: modelName,
        },
      }),
    );
  };

  return (
    <Drawer
      title={t('codeCompletionSettingsBar.title')}
      placement='left'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
      extra={
        <Button
          type={'text'}
          href={
            'https://whats2000.github.io/CodeBRT/docs/features/code-editor/code-completion'
          }
          target={'_blank'}
          icon={<QuestionCircleOutlined />}
          iconPosition={'end'}
        >
          <Typography.Text type={'secondary'}>{t('learnMore')}</Typography.Text>
        </Button>
      }
    >
      <StyledForm layout='vertical'>
        <Divider orientation={'left'} orientationMargin={0}>
          <Typography.Text type={'secondary'}>
            {t('codeCompletionSettingsBar.manualConfig')}
          </Typography.Text>
        </Divider>
        <FormGroup
          key={'manualTriggerCodeCompletion'}
          label={
            <Space>
              {t('codeCompletionSettingsBar.manualTriggerLabel')}
              <Tooltip
                title={t('codeCompletionSettingsBar.showMoreInfoTooltip')}
              >
                <Typography.Link
                  type={'secondary'}
                  onClick={() =>
                    setShowMoreInfo(
                      showMoreInfo === 'manualTriggerCodeCompletion'
                        ? null
                        : 'manualTriggerCodeCompletion',
                    )
                  }
                >
                  <QuestionCircleFilled />
                </Typography.Link>
              </Tooltip>
            </Space>
          }
        >
          <Checkbox
            checked={settings.manualTriggerCodeCompletion}
            onChange={handleCheckboxChange('manualTriggerCodeCompletion')}
          >
            <Typography.Text type={'secondary'}>
              {t('codeCompletionSettingsBar.enableManualTrigger')}
            </Typography.Text>
          </Checkbox>
        </FormGroup>
        <FormGroup
          key={'lastUsedManualCodeCompletionModelService'}
          label={t('codeCompletionSettingsBar.manualModelServiceLabel')}
        >
          <Select
            showSearch
            value={settings.lastUsedManualCodeCompletionModelService}
            onChange={handleSelectChange(
              'lastUsedManualCodeCompletionModelService',
            )}
            style={{
              width: '100%',
            }}
            loading={isLoading || isAvailableModelLoading}
            options={modelServiceOptions}
          />
        </FormGroup>
        <FormGroup
          key={'lastSelectedManualCodeCompletionModel'}
          label={t('codeCompletionSettingsBar.manualModelLabel')}
        >
          <Select
            showSearch
            value={
              settings.lastSelectedManualCodeCompletionModel[
                settings.lastUsedManualCodeCompletionModelService
              ]
            }
            onChange={(value) =>
              handleModelSelectChange(
                'lastSelectedManualCodeCompletionModel',
                settings.lastUsedManualCodeCompletionModelService,
                value,
              )
            }
            style={{
              width: '100%',
            }}
            loading={isLoading || isAvailableModelLoading}
            options={availableManualCodeCompletionModels.map((model) => ({
              key: model,
              label: model,
              value: model,
            }))}
          />
        </FormGroup>
        <Button
          style={{ marginBottom: 15 }}
          onClick={() =>
            callApi('openKeyboardShortcuts', 'code-brt.triggerInlineCompletion')
          }
        >
          <Typography.Text>
            {t('codeCompletionSettingsBar.editKeybinding')}
          </Typography.Text>
        </Button>
        {showMoreInfo === 'manualTriggerCodeCompletion' && (
          <Alert
            type={'info'}
            showIcon={true}
            closable={true}
            onClose={(_) => setTimeout(() => setShowMoreInfo(null), 500)}
            description={
              <Typography.Text type={'secondary'}>
                {t('codeCompletionSettingsBar.manualDescription')}
              </Typography.Text>
            }
          />
        )}
        <Divider orientation={'left'} orientationMargin={0}>
          <Typography.Text type={'secondary'}>
            {t('codeCompletionSettingsBar.autoConfig')}
          </Typography.Text>
        </Divider>
        <FormGroup
          key={'autoTriggerCodeCompletion'}
          label={
            <Space>
              {t('codeCompletionSettingsBar.autoTriggerLabel')}
              <Tooltip
                title={t('codeCompletionSettingsBar.showMoreInfoTooltip')}
              >
                <Typography.Link
                  type={'secondary'}
                  onClick={() =>
                    setShowMoreInfo(
                      showMoreInfo === 'autoTriggerCodeCompletion'
                        ? null
                        : 'autoTriggerCodeCompletion',
                    )
                  }
                >
                  <QuestionCircleFilled />
                </Typography.Link>
              </Tooltip>
            </Space>
          }
        >
          <Checkbox
            checked={settings.autoTriggerCodeCompletion}
            onChange={handleCheckboxChange('autoTriggerCodeCompletion')}
          >
            <Typography.Text type={'secondary'}>
              {t('codeCompletionSettingsBar.enableAutoTrigger')}
            </Typography.Text>
          </Checkbox>
        </FormGroup>
        <FormGroup
          key={'lastUsedAutoCodeCompletionModelService'}
          label={t('codeCompletionSettingsBar.autoModelServiceLabel')}
        >
          <Tooltip title={t('codeCompletionSettingsBar.ollamaTooltip')}>
            <Select
              showSearch
              value={settings.lastUsedAutoCodeCompletionModelService}
              onChange={handleSelectChange(
                'lastUsedAutoCodeCompletionModelService',
              )}
              style={{
                width: '100%',
              }}
              loading={isLoading || isAvailableModelLoading}
              options={[
                {
                  key: 'ollama',
                  label: 'ollama',
                  value: 'ollama',
                },
              ]}
              // options={modelServiceOptions}
            />
          </Tooltip>
        </FormGroup>
        <FormGroup
          key={'lastSelectedAutoCodeCompletionModel'}
          label={t('codeCompletionSettingsBar.autoModelLabel')}
        >
          <Tooltip
            title={
              <Typography.Text>
                <Trans
                  i18nKey={'codeCompletionSettingsBar.autoModelTooltip'}
                  components={{
                    supportModels: (
                      <Typography.Text type={'warning'}>
                        Stable Code, Qwen2.5-Coder, Codestral, CodeLlama,
                        DeepSeek-Coder, StarCoder
                      </Typography.Text>
                    ),
                  }}
                />
              </Typography.Text>
            }
          >
            <Select
              showSearch
              value={
                settings.lastSelectedAutoCodeCompletionModel[
                  settings.lastUsedAutoCodeCompletionModelService
                ]
              }
              onChange={(value) =>
                handleModelSelectChange(
                  'lastSelectedAutoCodeCompletionModel',
                  settings.lastUsedAutoCodeCompletionModelService,
                  value,
                )
              }
              style={{
                width: '100%',
              }}
              loading={isLoading || isAvailableModelLoading}
              options={availableAutoCodeCompletionModels.map((model) => ({
                key: model,
                label: model,
                value: model,
              }))}
            />
          </Tooltip>
        </FormGroup>
        {showMoreInfo === 'autoTriggerCodeCompletion' && (
          <Alert
            type={'info'}
            showIcon={true}
            closable={true}
            onClose={(_) => setTimeout(() => setShowMoreInfo(null), 500)}
            description={
              <Typography.Text type={'secondary'}>
                {t('codeCompletionSettingsBar.autoDescription')}
              </Typography.Text>
            }
          />
        )}
        <Button onClick={onClose} style={{ marginTop: 20 }}>
          {t('closeAndSave')}
        </Button>
      </StyledForm>
    </Drawer>
  );
};
