import React, { useContext, useEffect, useState } from 'react';
import { Flex, MenuProps, SelectProps } from 'antd';
import { Select, Button, Space, Dropdown, Drawer } from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuOutlined,
  AudioOutlined,
  PicRightOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { ExtensionSettings, ModelServiceType } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import { setConversationHistory } from '../../redux/slices/conversationSlice';
import {
  loadModelService,
  swapModel,
} from '../../redux/slices/modelServiceSlice';
import { WebviewContext } from '../../WebviewContext';
import { EditModelListBar } from './Toolbar/EditModelListBar';
import { HistorySidebar } from './Toolbar/HistorySidebar';
import { SettingsBar } from './Toolbar/SettingsBar';
import { VoiceSettingsBar } from './Toolbar/VoiceSettingsBar';
import { CodeCompletionSettingsBar } from './Toolbar/CodeCompletionSettingsBar';
import { useWindowSize } from '../../hooks';

const StyledSpace = styled(Space)`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px 10px 10px;
`;

const EditModelListButton = styled(Button)`
  display: flex;
  align-items: center;
`;

type ToolbarProps = {
  setTheme: (newTheme: {
    primaryColor?: ExtensionSettings['themePrimaryColor'];
    algorithm?: ExtensionSettings['themeAlgorithm'];
    borderRadius?: ExtensionSettings['themeBorderRadius'];
  }) => Promise<void>;
};

export const Toolbar: React.FC<ToolbarProps> = ({ setTheme }) => {
  const { callApi } = useContext(WebviewContext);
  const modelServices: ModelServiceType[] = [
    'anthropic',
    'gemini',
    'cohere',
    'openai',
    'groq',
    'huggingFace',
    'ollama',
    'custom',
  ];

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isCodeCompletionSettingsOpen, setIsCodeCompletionSettingsOpen] =
    useState(false);
  const [isSelectModelOpen, setIsSelectModelOpen] = useState(false);
  const [isEditModelListOpen, setIsEditModelListOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { activeModelService, availableModels, selectedModel, isLoading } =
    useSelector((state: RootState) => state.modelService);

  const { innerWidth } = useWindowSize();

  useEffect(() => {
    if (activeModelService === 'loading...' || isLoading) {
      return;
    }

    dispatch(loadModelService(activeModelService));
  }, [activeModelService]);

  const createNewChat = () => {
    if (activeModelService === 'loading...') {
      return;
    }
    callApi('addNewConversationHistory')
      .then(async (newConversationHistory) =>
        dispatch(setConversationHistory(await newConversationHistory)),
      )
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (value: ModelServiceType | 'loading...') => {
    if (value === 'loading...' || value === activeModelService || isLoading) {
      return;
    }
    dispatch(loadModelService(value));
  };

  const handleModelChange = (value: string) => {
    dispatch(swapModel(value));
  };

  const toggleHistorySidebar = () => {
    setIsHistorySidebarOpen(!isHistorySidebarOpen);
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  };

  const openEditModelList = () => {
    setIsEditModelListOpen(true);
  };

  const settingMenuItems: MenuProps['items'] = [
    {
      key: 'general',
      onClick: () => setIsSettingsOpen(true),
      label: 'General Settings',
      icon: <SettingOutlined />,
    },
    {
      key: 'voice',
      onClick: () => setIsVoiceSettingsOpen(true),
      label: 'Voice Settings',
      icon: <AudioOutlined />,
    },
    {
      key: 'code completion',
      onClick: () => setIsCodeCompletionSettingsOpen(true),
      label: 'Code Completion Settings',
      icon: <PicRightOutlined />,
    },
  ];

  const settingMenuItemsSmallWidth: MenuProps['items'] = [
    {
      key: 'History',
      onClick: toggleHistorySidebar,
      label: 'History',
      icon: <HistoryOutlined />,
    },
    {
      key: 'New Chat',
      onClick: createNewChat,
      label: 'New Chat',
      icon: <PlusOutlined />,
    },
    ...settingMenuItems,
  ];

  const modelServiceOptions: SelectProps['options'] = modelServices.map(
    (service) => ({
      key: service,
      label: service,
      value: service,
    }),
  );

  const modelOptions: SelectProps['options'] = [
    ...availableModels.map((model, index) => ({
      key: `available-${index}`,
      label: model,
      value: model,
    })),
    {
      key: 'edit',
      label: (
        <EditModelListButton
          icon={<SettingOutlined />}
          onClick={openEditModelList}
          style={{ width: '100%' }}
        >
          Edit Model List
        </EditModelListButton>
      ),
      value: 'edit',
      disabled: true,
      style: { paddingLeft: 0, paddingRight: 0 },
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Flex justify={'space-between'} align={'center'}>
            <span>Select Model</span>
            <Space>
              <Button
                icon={<HistoryOutlined />}
                onClick={toggleHistorySidebar}
              />
              <Button icon={<PlusOutlined />} onClick={createNewChat} />
              <Dropdown menu={{ items: settingMenuItems }}>
                <Button icon={<SettingOutlined />} />
              </Dropdown>
            </Space>
          </Flex>
        }
        placement='right'
        open={isSelectModelOpen}
        onClose={() => setIsSelectModelOpen(false)}
        loading={isLoading}
      >
        <Select
          value={isLoading ? 'Loading...' : selectedModel}
          onChange={handleModelChange}
          style={{ width: '100%' }}
          options={modelOptions}
        />
      </Drawer>
      <StyledSpace>
        <Space wrap>
          <Flex justify={'space-between'} gap={10}>
            <Select
              showSearch
              value={activeModelService}
              onChange={handleModelServiceChange}
              style={{
                width: innerWidth < 550 ? 200 : 125,
              }}
              loading={isLoading}
              options={modelServiceOptions}
            />
          </Flex>
          <Select
            showSearch
            value={isLoading ? 'Loading...' : selectedModel}
            onChange={handleModelChange}
            style={{
              width: innerWidth < 550 ? 200 : '100%',
              minWidth: 150,
            }}
            loading={isLoading}
            options={modelOptions}
          />
        </Space>
        {innerWidth < 400 ? (
          <Dropdown menu={{ items: settingMenuItemsSmallWidth }}>
            <Button icon={<MenuOutlined />} />
          </Dropdown>
        ) : (
          <Space>
            <Button icon={<HistoryOutlined />} onClick={toggleHistorySidebar} />
            <Button icon={<PlusOutlined />} onClick={createNewChat} />
            <Dropdown menu={{ items: settingMenuItems }}>
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
        )}
      </StyledSpace>
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={toggleHistorySidebar}
      />
      <SettingsBar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        setTheme={setTheme}
      />
      <VoiceSettingsBar
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
      <EditModelListBar
        isOpen={isEditModelListOpen}
        onClose={() => setIsEditModelListOpen(false)}
      />
      <CodeCompletionSettingsBar
        isOpen={isCodeCompletionSettingsOpen}
        onClose={() => setIsCodeCompletionSettingsOpen(false)}
      />
    </>
  );
};
