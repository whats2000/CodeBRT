import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { WebviewContext } from '../WebviewContext';
import { ModelType } from '../../types/modelType';
import { ConversationHistory, ConversationHistoryList } from '../../types/conversationHistory';

const SidebarContainer = styled.div<{ isOpen: boolean }>`
  width: ${(props) => (props.isOpen ? '250px' : '0')};
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #111;
  overflow-x: hidden;
  transition: 0.5s;
  padding-top: 60px;
  color: white;
`;

const CloseBtn = styled.span`
  position: absolute;
  top: 10px;
  right: 25px;
  font-size: 36px;
  cursor: pointer;
`;

const HistoryList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const HistoryItem = styled.li`
  padding: 10px 15px;
  text-decoration: none;
  font-size: 20px;
  color: white;
  display: block;
  transition: 0.3s;
  cursor: pointer;

  &:hover {
    background-color: #575757;
  }
`;

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, activeModel, setMessages }) => {
  const { callApi } = useContext(WebviewContext);
  const [histories, setHistories] = useState<ConversationHistoryList>({});

  useEffect(() => {
    if (isOpen) {
      callApi('getHistories', activeModel)
        .then((histories) => setHistories(histories as ConversationHistoryList))
        .catch((error) => callApi('alertMessage', `Failed to load histories: ${error}`, 'error'));
    }
  }, [isOpen, activeModel]);

  const switchHistory = (historyID: string) => {
    callApi('switchHistory', activeModel, historyID)
      .then(() => callApi('getLanguageModelConversationHistory', activeModel))
      .then((history) => setMessages(history))
      .catch((error) => callApi('alertMessage', `Failed to switch history: ${error}`, 'error'));
    onClose();
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseBtn onClick={onClose}>&times;</CloseBtn>
      <HistoryList>
        {histories && Object.keys(histories).map((historyID) => (
          <HistoryItem key={historyID} onClick={() => switchHistory(historyID)}>
            {histories[historyID].title}
          </HistoryItem>
        ))}
      </HistoryList>
    </SidebarContainer>
  );
};
