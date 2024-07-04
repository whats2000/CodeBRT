import React, { useContext, useEffect, useState } from 'react';
import { Select, Button, Space, Drawer } from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { ModelType } from '../../../types/modelType';
import { ConversationHistory } from '../../../types/conversationHistory';
import { WebviewContext } from '../../WebviewContext';
import { HistorySidebar } from './Toolbar/HistorySidebar';
import { SettingsBar } from './Toolbar/SettingsBar';
import styled from 'styled-components';
import { EditModelListBar } from './Toolbar/EditModelListBar';

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

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    if (isHistorySidebarOpen) {
      setIsHistorySidebarOpen(false);
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
  };

  return (
    <>
      <StyledSpace>
        <Space>
          {isOffCanvas ? (
            <>
              <Select
                value={activeModel}
                onChange={handleModelServiceChange}
                style={{ width: 100 }}
                loading={isActiveModelLoading}
              >
                {modelServices.map((service) => (
                  <Option key={service} value={service}>
                    {service}
                  </Option>
                ))}
              </Select>
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
                value={activeModel}
                onChange={handleModelServiceChange}
                style={{ width: 150 }}
                loading={isActiveModelLoading}
              >
                {modelServices.map((service) => (
                  <Option key={service} value={service}>
                    {service}
                  </Option>
                ))}
              </Select>
              <Select
                value={isActiveModelLoading ? 'Loading...' : selectedModel}
                onChange={handleModelChange}
                style={{ width: 200 }}
                loading={isActiveModelLoading}
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
            </>
          )}
        </Space>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={toggleHistorySidebar} />
          <Button icon={<PlusOutlined />} onClick={createNewChat} />
          <Button icon={<SettingOutlined />} onClick={toggleSettings} />
        </Space>
      </StyledSpace>
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={toggleHistorySidebar}
        messages={messages}
        activeModel={activeModel}
        setMessages={setMessages}
      />
      <SettingsBar isOpen={isSettingsOpen} onClose={toggleSettings} />
      <EditModelListBar
        isOpen={isEditModelListOpen}
        onClose={() => setIsEditModelListOpen(false)}
        activeModel={activeModel}
        handleEditModelListSave={handleEditModelListSave}
      />
    </>
  );
};
