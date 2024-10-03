import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CheckboxProps } from 'antd/es/checkbox';
import {
  Alert,
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

import type { AppDispatch, RootState } from '../../../redux';
import type {
  CodeCompletionSettings,
  ExtensionSettings,
} from '../../../../types';
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
  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings } = useSelector(
    (state: RootState) => state.settings,
  );

  const [showMoreInfo, setShowMoreInfo] = useState<
    keyof CodeCompletionSettings | null
  >(null);

  const modelServiceOptions: SelectProps['options'] =
    AVAILABLE_MODEL_SERVICES.map((service) => ({
      key: service,
      label: service,
      value: service,
    }));

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
            loading={isLoading}
            options={modelServiceOptions}
          />
        </FormGroup>
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
            disabled={true}
          >
            <Typography.Text type='secondary'>
              Enable Auto Trigger Code Completion (Soon)
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
            loading={isLoading}
            options={modelServiceOptions}
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
      </StyledForm>
    </Drawer>
  );
};
