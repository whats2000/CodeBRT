import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ModelType } from '../../types/modelType';
import { ConversationHistory } from '../../types/conversationHistory';
import { NewChat, SettingIcon, HistoryIcon } from '../../icons';
import { WebviewContext } from '../WebviewContext';
import { HistorySidebar } from './HistorySidebar';

const StyledToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 15px 5px 5px;

  & > div {
    display: flex;
    align-items: center;
  }
`;

const ToolbarButton = styled.button`
  padding: 5px;
  color: #f0f0f0;
  background-color: transparent;
  display: flex;
  align-items: center;
  border: none;
  border-radius: 4px;

  &:hover {
    background-color: #333;
  }
`;

const ModelSelect = styled.select`
  padding: 5px 10px;
  border-radius: 4px;
  background-color: #666;
  color: white;
  border: none;
  height: 30px;
  margin-left: 5px;

  &:focus {
    outline: none;
  }
`;

const AvailableModelSelect = styled.select`
  padding: 5px 10px;
  border-radius: 4px;
  background-color: #666;
  color: white;
  border: none;
  height: 30px;
  margin-left: 5px;

  &:focus {
    outline: none;
  }
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
  const modelServices: ModelType[] = ['gemini', 'cohere', 'openai', 'groq'];
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    callApi('getAvailableModels', activeModel)
      .then((models: string[]) => setAvailableModels(models))
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to load available models: ${error}`,
          'error',
        ).catch(console.error),
      );
  }, [activeModel]);

  const openSettings = () => {
    callApi('showSettingsView').catch((error) =>
      callApi(
        'alertMessage',
        `Failed to open settings: ${error}`,
        'error',
      ).catch(console.error),
    );
  };

  const createNewChat = () => {
    callApi('addNewConversationHistory', activeModel)
      .then((newConversationHistory) => setMessages(newConversationHistory))
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setActiveModel(event.target.value as ModelType);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    callApi('switchModel', activeModel, newModel).catch((error) =>
      callApi(
        'alertMessage',
        `Failed to switch model: ${error}`,
        'error',
      ).catch(console.error),
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <StyledToolbar>
        <div>
          <ModelSelect value={activeModel} onChange={handleModelServiceChange}>
            {modelServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </ModelSelect>
          <AvailableModelSelect
            value={selectedModel}
            onChange={handleModelChange}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </AvailableModelSelect>
        </div>
        <div>
          <ToolbarButton onClick={toggleSidebar}>
            <HistoryIcon />
          </ToolbarButton>
          <ToolbarButton onClick={createNewChat}>
            <NewChat />
          </ToolbarButton>
          <ToolbarButton onClick={openSettings}>
            <SettingIcon />
          </ToolbarButton>
        </div>
      </StyledToolbar>
      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        messages={messages}
        activeModel={activeModel}
        setMessages={setMessages}
      />
    </>
  );
};
