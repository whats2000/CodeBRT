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
import { QuestionCircleFilled } from '@ant-design/icons';
import styled from 'styled-components';

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
      title='Code Completion Settings'
      placement='left'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      <StyledForm layout='vertical'>
        <Divider orientation={'left'} orientationMargin={0}>
          <Typography.Text type='secondary'>
            Manually Trigger Configuration
          </Typography.Text>
        </Divider>
        <FormGroup
          key={'manualTriggerCodeCompletion'}
          label={
            <Space>
              Manual Trigger Code Completion
              <Tooltip title='Click to show more information'>
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
            <Typography.Text type='secondary'>
              Enable Manual Trigger Code Completion
            </Typography.Text>
          </Checkbox>
        </FormGroup>
        <FormGroup
          key={'lastUsedManualCodeCompletionModelService'}
          label={'Model Service for Manual Code Completion'}
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
          label={'Model for Manual Code Completion'}
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
          <Typography.Text>Edit Keybinding</Typography.Text>
        </Button>
        {showMoreInfo === 'manualTriggerCodeCompletion' && (
          <Alert
            type={'info'}
            showIcon={true}
            closable={true}
            onClose={(_) => setTimeout(() => setShowMoreInfo(null), 500)}
            description={
              <Typography.Text type='secondary'>
                This will use more context, resources and token to provide
                higher quality completions.
              </Typography.Text>
            }
          />
        )}
        <Divider orientation={'left'} orientationMargin={0}>
          <Typography.Text type='secondary'>
            Auto Trigger Configuration
          </Typography.Text>
        </Divider>
        <FormGroup
          key={'autoTriggerCodeCompletion'}
          label={
            <Space>
              Auto Trigger Code Completion
              <Tooltip title='Click to show more information'>
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
            <Typography.Text type='secondary'>
              Enable Auto Trigger Code Completion
            </Typography.Text>
          </Checkbox>
        </FormGroup>
        <FormGroup
          key={'lastUsedAutoCodeCompletionModelService'}
          label={'Model Service for Auto Code Completion'}
        >
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
            options={modelServiceOptions}
          />
        </FormGroup>
        <FormGroup
          key={'lastSelectedAutoCodeCompletionModel'}
          label={'Model for Auto Code Completion'}
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
        </FormGroup>
        {showMoreInfo === 'autoTriggerCodeCompletion' && (
          <Alert
            type={'info'}
            showIcon={true}
            closable={true}
            onClose={(_) => setTimeout(() => setShowMoreInfo(null), 500)}
            description={
              <Typography.Text type='secondary'>
                This will use when you typing pause for a moment. Which mean
                will faster suit for simple code snippet.
              </Typography.Text>
            }
          />
        )}
        <Button onClick={onClose} style={{ marginTop: 20 }}>
          Close and Save
        </Button>
      </StyledForm>
    </Drawer>
  );
};
