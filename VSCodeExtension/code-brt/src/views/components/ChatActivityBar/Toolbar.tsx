import React, { useContext, useEffect, useState } from 'react';
import { Flex, MenuProps, SelectProps } from 'antd';
import { Select, Button, Space, Dropdown, Drawer } from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import { ConversationHistory, ModelServiceType } from '../../../types';
import { WebviewContext } from '../../WebviewContext';
import { EditModelListBar } from './Toolbar/EditModelListBar';
import { HistorySidebar } from './Toolbar/HistorySidebar';
import { SettingsBar } from './Toolbar/SettingsBar';
import { VoiceSettingsBar } from './Toolbar/VoiceSettingsBar';
import { useWindowSize } from '../../hooks';

const StyledSpace = styled(Space)`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
`;

const EditModelListButton = styled(Button)`
  display: flex;
  align-items: center;
`;

type ToolbarProps = {
  activeModelService: ModelServiceType | 'loading...';
  setActiveModelService: React.Dispatch<
    React.SetStateAction<ModelServiceType | 'loading...'>
  >;
  conversationHistory: ConversationHistory;
  isActiveModelLoading: boolean;
  setIsActiveModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setConversationHistory: React.Dispatch<
    React.SetStateAction<ConversationHistory>
  >;
  setTheme: (newTheme: {
    primaryColor?: string | undefined;
    algorithm?:
      | 'defaultAlgorithm'
      | 'darkAlgorithm'
      | 'compactAlgorithm'
      | undefined;
    borderRadius?: number | undefined;
  }) => Promise<void>;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  activeModelService,
  setActiveModelService,
  conversationHistory,
  isActiveModelLoading,
  setIsActiveModelLoading,
  setConversationHistory,
  setTheme,
}) => {
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
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isSelectModelOpen, setIsSelectModelOpen] = useState(false);
  const [isEditModelListOpen, setIsEditModelListOpen] = useState(false);

  const { innerWidth } = useWindowSize();

  useEffect(() => {
    setIsActiveModelLoading(true);
    if (activeModelService === 'loading...') {
      return;
    }

    callApi('getAvailableModels', activeModelService)
      .then((models: string[]) => {
        setAvailableModels(models);
        setIsActiveModelLoading(false);
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to load available models: ${error}`,
          'error',
        ).catch(console.error);
        setIsActiveModelLoading(false);
      });

    callApi('getCurrentModel', activeModelService)
      .then((model: string) => setSelectedModel(model))
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to load current model: ${error}`,
          'error',
        ).catch(console.error),
      );
  }, [activeModelService]);

  const createNewChat = () => {
    if (activeModelService === 'loading...') {
      return;
    }
    callApi('addNewConversationHistory', activeModelService)
      .then((newConversationHistory) =>
        setConversationHistory(newConversationHistory),
      )
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (value: ModelServiceType | 'loading...') => {
    setIsActiveModelLoading(true);

    if (value === 'loading...') {
      return;
    }

    setActiveModelService(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);

    if (activeModelService === 'loading...') {
      return;
    }

    callApi('switchModel', activeModelService, value).catch((error) =>
      callApi(
        'alertMessage',
        `Failed to switch model: ${error}`,
        'error',
      ).catch(console.error),
    );
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

  const handleEditModelListSave = (newAvailableModels: string[]) => {
    if (activeModelService === 'loading...') return;

    setAvailableModels(newAvailableModels);

    if (newAvailableModels.length === 0) {
      setSelectedModel('');
      callApi('switchModel', activeModelService, '').catch((error) =>
        callApi(
          'alertMessage',
          `Failed to switch model: ${error}`,
          'error',
        ).catch(console.error),
      );
      return;
    }

    if (!newAvailableModels.includes(selectedModel)) {
      callApi('switchModel', activeModelService, newAvailableModels[0])
        .then(() => setSelectedModel(newAvailableModels[0]))
        .catch((error) =>
          callApi(
            'alertMessage',
            `Failed to switch model: ${error}`,
            'error',
          ).catch(console.error),
        );
    }
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
        loading={isActiveModelLoading}
      >
        <Select
          value={isActiveModelLoading ? 'Loading...' : selectedModel}
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
              loading={isActiveModelLoading}
              options={modelServiceOptions}
            />
          </Flex>
          <Select
            showSearch
            value={isActiveModelLoading ? 'Loading...' : selectedModel}
            onChange={handleModelChange}
            style={{
              width: innerWidth < 550 ? 200 : '100%',
              minWidth: 150,
            }}
            loading={isActiveModelLoading}
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
        conversationHistory={conversationHistory}
        activeModelService={activeModelService}
        setConversationHistory={setConversationHistory}
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
        activeModelService={activeModelService}
        handleEditModelListSave={handleEditModelListSave}
      />
    </>
  );
};
