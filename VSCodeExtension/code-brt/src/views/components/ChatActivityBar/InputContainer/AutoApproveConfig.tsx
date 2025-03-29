import React, { useState } from 'react';
import { Checkbox, Drawer, Space, Typography, Select, Form, Flex, Input, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { AppDispatch, RootState } from '../../../redux';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';
import { useRefs } from '../../../context/RefContext';

// Define the tools that can be configured
const AVAILABLE_TOOLS = [
  'webSearch',
  'urlFetcher',
  'executeCommand',
  'readFile',
  'writeToFile',
  'searchFiles',
  'listFiles',
  'listCodeDefinitionNames',
  'inspectSite',
] as const;

export const AutoApproveConfig: React.FC = () => {
  const { t } = useTranslation('common');
  const dispatch = useDispatch<AppDispatch>();
  const { registerRef } = useRefs();
  const [isOpen, setIsOpen] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState('');

  const autoApproveButtonRef = registerRef('autoApproveButton');

  const { settings } = useSelector((state: RootState) => state.settings);
  const autoApproveActions = settings.autoApproveActions || [];
  const commandBlacklist = settings.autoApproveExecuteCommandBlacklistRegex || [];

  // Calculate checkbox state based on auto-approve actions
  const isAllChecked = autoApproveActions.length === AVAILABLE_TOOLS.length;
  const isIndeterminate = autoApproveActions.length > 0 && !isAllChecked;

  const handleAutoApproveChange = (values: string[]) => {
    dispatch(
      updateAndSaveSetting({
        key: 'autoApproveActions',
        value: values,
      }),
    );
  };

  const handleBlacklistInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlacklistInput(e.target.value);
  };

  const handleBlacklistAdd = () => {
    if (blacklistInput && !commandBlacklist.includes(blacklistInput)) {
      const newBlacklist = [...commandBlacklist, blacklistInput];
      dispatch(
        updateAndSaveSetting({
          key: 'autoApproveExecuteCommandBlacklistRegex',
          value: newBlacklist,
        }),
      );
      setBlacklistInput('');
    }
  };

  const handleBlacklistRemove = (regex: string) => {
    const newBlacklist = commandBlacklist.filter(item => item !== regex);
    dispatch(
      updateAndSaveSetting({
        key: 'autoApproveExecuteCommandBlacklistRegex',
        value: newBlacklist,
      }),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlacklistAdd();
    }
  };

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const toolOptions = AVAILABLE_TOOLS.map((tool) => ({
    label: t(`tools.${tool}`, tool),
    value: tool,
  }));

  return (
    <>
      <Flex
        align={'center'}
        justify={'center'}
        style={{
          cursor: 'pointer',
          marginLeft: '10px',
        }}
        onClick={toggleDrawer}
        title={t('autoConfig.title')}
      >
        <Checkbox
          ref={autoApproveButtonRef}
          indeterminate={isIndeterminate}
          checked={isAllChecked}
        />
        <span style={{ marginLeft: '8px' }}>
          {t('autoConfig.title')} ({autoApproveActions.length})
        </span>
      </Flex>
      <Drawer
        title={t('autoConfig.title')}
        placement='right'
        onClose={toggleDrawer}
        open={isOpen}
        width={350}
      >
        <Space direction='vertical' style={{ width: '100%' }}>
          <Typography.Paragraph>
            {t('autoConfig.description')}
          </Typography.Paragraph>

          <Form layout='vertical' style={{ width: '100%' }}>
            <Form.Item
              label={t('autoConfig.autoApprove')}
              tooltip={t('autoConfig.autoApproveTooltip')}
            >
              <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder={t('autoConfig.selectTools')}
                value={autoApproveActions}
                onChange={handleAutoApproveChange}
                options={toolOptions}
              />
            </Form.Item>

            {/* Command Blacklist Configuration */}
            <Form.Item
              label={t('autoConfig.commandBlacklist', 'Command Blacklist Regex')}
              tooltip={t('autoConfig.commandBlacklistTooltip', 'Commands matching these regex patterns will never be auto-executed (e.g., "sudo.*")')}
            >
              <Input
                placeholder={t('autoConfig.addBlacklistPattern', 'Add regex pattern')}
                value={blacklistInput}
                onChange={handleBlacklistInputChange}
                onKeyPress={handleKeyPress}
                onPressEnter={handleBlacklistAdd}
                addonAfter={
                  <span 
                    onClick={handleBlacklistAdd}
                    style={{ cursor: 'pointer' }}
                  >
                    {t('autoConfig.add', 'Add')}
                  </span>
                }
              />
              <div style={{ marginTop: '8px' }}>
                {commandBlacklist.map(regex => (
                  <Tag
                    key={regex}
                    closable
                    onClose={() => handleBlacklistRemove(regex)}
                    style={{ margin: '4px' }}
                  >
                    {regex}
                  </Tag>
                ))}
              </div>
            </Form.Item>
          </Form>
        </Space>
      </Drawer>
    </>
  );
};
