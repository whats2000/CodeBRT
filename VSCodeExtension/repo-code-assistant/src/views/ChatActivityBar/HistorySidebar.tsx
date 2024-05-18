import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { WebviewContext } from '../WebviewContext';
import { ModelType } from '../../types/modelType';
import { DeleteIcon } from "../../icons";
import { ConversationHistory, ConversationHistoryList } from '../../types/conversationHistory';
import LoadingSpinner from '../common/LoadingSpinner';

const SidebarContainer = styled.div<{ isOpen: boolean }>`
  width: 250px;
  position: fixed;
  z-index: 1;
  top: 0;
  left: ${(props) => (props.isOpen ? '0' : '-250px')};
  height: 100%;
  background-color: #111;
  overflow-x: hidden;
  transition: left 0.5s;
  padding-top: 60px;
  color: white;
`;

const CloseBtn = styled.span`
  position: absolute;
  top: 10px;
  right: 15px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: 0.3s;
  cursor: pointer;

  &:hover {
    background-color: #575757;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;

  &:hover {
    color: red;
  }
`;

const NoHistoryMessageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const NoHistoryMessage = styled.div`
  color: lightgray;
  text-align: center;
`;

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({isOpen, onClose, activeModel, setMessages}) => {
  const {callApi} = useContext(WebviewContext);
  const [histories, setHistories] = useState<ConversationHistoryList>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      callApi('getHistories', activeModel)
        .then((histories) => {
          setHistories(histories as ConversationHistoryList);
          setIsLoading(false);
        })
        .catch((error) => {
          callApi('alertMessage', `Failed to load histories: ${error}`, 'error')
            .catch((error) => console.error(error));
          setIsLoading(false);
        });
    }
  }, [isOpen, activeModel]);

  const switchHistory = (historyID: string) => {
    setIsLoading(true);
    callApi('switchHistory', activeModel, historyID)
      .then(() => callApi('getLanguageModelConversationHistory', activeModel))
      .then((history) => {
        setMessages(history);
        setIsLoading(false);  // End loading after switching history
      })
      .catch((error) => {
        callApi('alertMessage', `Failed to switch history: ${error}`, 'error')
          .catch((error) => console.error(error));
        setIsLoading(false);
      });
    onClose();
  };

  const deleteHistory = (historyID: string) => {
    callApi('deleteHistory', activeModel, historyID)
      .then((newConversationHistory) => {
        setHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };
          delete updatedHistories[historyID];
          return updatedHistories;
        });

        setMessages(newConversationHistory);
      })
      .catch((error) => callApi('alertMessage', `Failed to delete history: ${error}`, 'error')
        .catch((error) => console.error(error)));
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseBtn onClick={onClose}>&times;</CloseBtn>
      {isLoading ? (
        <LoadingSpinner/>
      ) : Object.keys(histories).length - Object.keys(histories).filter((historyID) => historyID === "").length === 0 ? (
        <NoHistoryMessageContainer>
          <NoHistoryMessage>Nothing Currently</NoHistoryMessage>
        </NoHistoryMessageContainer>
      ) : (
        <HistoryList>
          {Object.keys(histories).map((historyID) => historyID !== "" && (
            <HistoryItem key={historyID} onClick={() => switchHistory(historyID)}>
              <span>{histories[historyID].title}</span>
              <DeleteButton onClick={(e) => {
                e.stopPropagation();
                deleteHistory(historyID);
              }}>
                <DeleteIcon />
              </DeleteButton>
            </HistoryItem>
          ))}
        </HistoryList>
      )}
    </SidebarContainer>
  );
};
