import React, { useContext, useEffect, useState } from 'react';
import { Select, Button, Space, Dropdown, Drawer, MenuProps } from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import { ConversationHistory, ModelType } from '../../../types';
import { WebviewContext } from '../../WebviewContext';
import { EditModelListBar } from './Toolbar/EditModelListBar';
import { HistorySidebar } from './Toolbar/HistorySidebar';
import { SettingsBar } from './Toolbar/SettingsBar';
import { VoiceSettingsBar } from './Toolbar/VoiceSettingsBar';

const { Option } = Select;

const StyledSpace = styled(Space)`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
`;

const EditModelListButton = styled(Button)`
  display: flex;
  align-items: center;
`;

interface ToolbarProps {
  activeModel: ModelType | 'loading...';
  messages: ConversationHistory;
  isActiveModelLoading: boolean;
  setIsActiveModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  setActiveModel: React.Dispatch<
    React.SetStateAction<ModelType | 'loading...'>
  >;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeModel,
  messages,
  isActiveModelLoading,
  setIsActiveModelLoading,
  setMessages,
  setActiveModel,
}) => {
  const { callApi } = useContext(WebviewContext);
  const modelServices: ModelType[] = [
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
  const [isOffCanvas, setIsOffCanvas] = useState(false);
  const [isSelectModelOpen, setIsSelectModelOpen] = useState(false);
  const [isEditModelListOpen, setIsEditModelListOpen] = useState(false);

  useEffect(() => {
    setIsActiveModelLoading(true);
    if (activeModel === 'loading...') {
      return;
    }

    callApi('getAvailableModels', activeModel)
      .then((models: string[]) => {
        setAvailableModels(models);
        setSelectedModel(models[0]);
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

    const handleResize = () => {
      setIsOffCanvas(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeModel]);

  const createNewChat = () => {
    if (activeModel === 'loading...') {
      return;
    }
    callApi('addNewConversationHistory', activeModel)
      .then((newConversationHistory) => setMessages(newConversationHistory))
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (value: ModelType | 'loading...') => {
    setIsActiveModelLoading(true);

    if (value === 'loading...') {
      return;
    }

    setActiveModel(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);

    if (activeModel === 'loading...') {
      return;
    }

    callApi('switchModel', activeModel, value).catch((error) =>
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
    if (activeModel === 'loading...') return;

    setAvailableModels(newAvailableModels);

    if (newAvailableModels.length === 0) {
      setSelectedModel('');
      return;
    }

    if (!newAvailableModels.includes(selectedModel)) {
      callApi('switchModel', activeModel, newAvailableModels[0])
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
    },
    {
      key: 'voice',
      onClick: () => setIsVoiceSettingsOpen(true),
      label: 'Voice Settings',
    },
  ];

  return (
    <>
      <StyledSpace>
        <Space>
          {isOffCanvas ? (
            <>
              <Select
                showSearch
                value={activeModel}
                onChange={handleModelServiceChange}
                style={{ width: 100 }}
                loading={isActiveModelLoading}
                options={modelServices.map((service) => ({
                  key: service,
                  label: service,
                  value: service,
                }))}
              />
              <Button onClick={() => setIsSelectModelOpen(true)}>
                {selectedModel}
              </Button>
              <Drawer
                title='Select Model'
                placement='right'
                open={isSelectModelOpen}
                onClose={() => setIsSelectModelOpen(false)}
                loading={isActiveModelLoading}
              >
                <Select
                  value={isActiveModelLoading ? 'Loading...' : selectedModel}
                  onChange={handleModelChange}
                  style={{ width: '100%' }}
                >
                  {availableModels.map((model) => (
                    <Option key={model} value={model}>
                      {model}
                    </Option>
                  ))}
                  <Option
                    value='edit'
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                    disabled
                  >
                    <EditModelListButton
                      icon={<SettingOutlined />}
                      onClick={openEditModelList}
                      style={{ width: '100%' }}
                    >
                      Edit Model List
                    </EditModelListButton>
                  </Option>
                </Select>
              </Drawer>
            </>
          ) : (
            <>
              <Select
                showSearch
                value={activeModel}
                onChange={handleModelServiceChange}
                style={{ width: 150 }}
                loading={isActiveModelLoading}
                options={modelServices.map((service) => ({
                  key: service,
                  label: service,
                  value: service,
                }))}
              />
              <Select
                showSearch
                value={isActiveModelLoading ? 'Loading...' : selectedModel}
                onChange={handleModelChange}
                style={{ width: 200 }}
                loading={isActiveModelLoading}
                options={[
                  ...availableModels.map((model) => ({
                    key: model,
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
                ]}
              />
            </>
          )}
        </Space>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={toggleHistorySidebar} />
          <Button icon={<PlusOutlined />} onClick={createNewChat} />
          <Dropdown menu={{ items: settingMenuItems }}>
            <Button icon={<SettingOutlined />} />
          </Dropdown>
        </Space>
      </StyledSpace>
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={toggleHistorySidebar}
        messages={messages}
        activeModel={activeModel}
        setMessages={setMessages}
      />
      <SettingsBar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <VoiceSettingsBar
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
      <EditModelListBar
        isOpen={isEditModelListOpen}
        onClose={() => setIsEditModelListOpen(false)}
        activeModel={activeModel}
        handleEditModelListSave={handleEditModelListSave}
      />
    </>
  );
};
