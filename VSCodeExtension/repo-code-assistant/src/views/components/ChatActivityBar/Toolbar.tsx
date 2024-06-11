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
import { HistorySidebar } from './HistorySidebar';
import { SettingsBar } from './SettingsBar';
import styled from 'styled-components';

const { Option } = Select;

const StyledSpace = styled(Space)`
  display: flex;
  justify-content: space-between;
  padding: 5px 15px;
`;

interface ToolbarProps {
  activeModel: ModelType;
  messages: ConversationHistory;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  setActiveModel: React.Dispatch<React.SetStateAction<ModelType>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeModel,
  messages,
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
    'custom',
  ];
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOffCanvas, setIsOffCanvas] = useState(false);
  const [isSelectModelOpen, setIsSelectModelOpen] = useState(false);

  useEffect(() => {
    callApi('getAvailableModels', activeModel)
      .then((models: string[]) => {
        setAvailableModels(models);
        setSelectedModel(models[0]);
      })
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to load available models: ${error}`,
          'error',
        ).catch(console.error),
      );

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
    callApi('addNewConversationHistory', activeModel)
      .then((newConversationHistory) => setMessages(newConversationHistory))
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (value: ModelType) => {
    setActiveModel(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
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
              >
                <Select
                  value={selectedModel}
                  onChange={handleModelChange}
                  style={{ width: '100%' }}
                >
                  {availableModels.map((model) => (
                    <Option key={model} value={model}>
                      {model}
                    </Option>
                  ))}
                </Select>
              </Drawer>
            </>
          ) : (
            <>
              <Select
                value={activeModel}
                onChange={handleModelServiceChange}
                style={{ width: 150 }}
              >
                {modelServices.map((service) => (
                  <Option key={service} value={service}>
                    {service}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedModel}
                onChange={handleModelChange}
                style={{ width: 200 }}
              >
                {availableModels.map((model) => (
                  <Option key={model} value={model}>
                    {model}
                  </Option>
                ))}
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
      <SettingsBar
        isOpen={isSettingsOpen}
        onClose={toggleSettings}
        activeModel={activeModel}
      />
    </>
  );
};
