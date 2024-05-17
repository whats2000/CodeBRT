import React, { useContext, useState } from "react";
import styled from "styled-components";

import { ModelType } from "../../types/modelType";
import { ConversationHistory } from "../../types/conversationHistory";
import { CleanHistoryIcon, SettingIcon, HistoryIcon } from "../../icons";
import { WebviewContext } from "../WebviewContext";
import { HistorySidebar } from "./HistorySidebar";

const StyledToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 15px 5px 5px;

  & > div {
    display: flex;
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

interface ToolbarProps {
  activeModel: ModelType;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  setActiveModel: React.Dispatch<React.SetStateAction<ModelType>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeModel, setMessages, setActiveModel }) => {
  const { callApi } = useContext(WebviewContext);
  const options: ModelType[] = ["gemini", "cohere", "openai"];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSettings = () => {
    callApi("showSettingsView")
      .catch((error) =>
        callApi("alertMessage", `Failed to open settings: ${error}`, "error")
          .catch(console.error)
      );
  };

  const clearHistory = () => {
    callApi("clearLanguageConversationHistory", activeModel)
      .then(() => setMessages({
        title: "",
        create_time: 0,
        update_time: 0,
        root: "",
        current: "",
        entries: {},
      }))
      .catch((error) => console.error("Failed to clear conversation history:", error));
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveModel(event.target.value as ModelType);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <StyledToolbar>
        <ModelSelect value={activeModel} onChange={handleModelChange}>
          {options.map((model) => <option key={model} value={model}>{model}</option>)}
        </ModelSelect>
        <div>
          <ToolbarButton onClick={toggleSidebar}><HistoryIcon /></ToolbarButton>
          <ToolbarButton onClick={openSettings}><SettingIcon /></ToolbarButton>
          <ToolbarButton onClick={clearHistory}><CleanHistoryIcon /></ToolbarButton>
        </div>
      </StyledToolbar>
      <HistorySidebar isOpen={isSidebarOpen} onClose={toggleSidebar} activeModel={activeModel} setMessages={setMessages} />
    </>
  );
};
