import React, { SetStateAction, useContext } from "react";
import styled from "styled-components";

import { ModelType } from "../../types/modelType";
import { ConversationHistory } from "../../types/conversationHistory";
import { CleanHistoryIcon, SettingIcon } from "../../icons";
import { WebviewContext } from "../WebviewContext";

const StyledToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 5px 15px 5px 5px;
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

interface ToolbarProps {
  activeModel: ModelType;
  setMessages: React.Dispatch<SetStateAction<ConversationHistory>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({activeModel, setMessages}) => {
  const {callApi} = useContext(WebviewContext);

  const openSettings = () => {
    callApi("showSettingsView")
      .catch((error) =>
        callApi("alertMessage", `Failed to open settings: ${error}`, "error")
          .catch(console.error)
      );
  }

  const clearHistory = () => {
    callApi("clearLanguageConversationHistory", activeModel)
      .then(() => setMessages({entries: []}))
      .catch((error) => console.error("Failed to clear conversation history:", error));
  }

  return (
    <StyledToolbar>
      <ToolbarButton onClick={openSettings}><SettingIcon/></ToolbarButton>
      <ToolbarButton onClick={clearHistory}><CleanHistoryIcon/></ToolbarButton>
    </StyledToolbar>
  );
}
