import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, List, Typography } from 'antd';

import { WebviewContext } from '../../WebviewContext';
import { ModelType } from '../../../types/modelType';
import {
  ConversationHistory,
  ConversationHistoryList,
} from '../../../types/conversationHistory';
import { DeleteOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

const StyledDrawer = styled(Drawer)`
  & .ant-drawer-header {
    padding: 10px;
  }

  & div.ant-drawer-body {
    padding: 0;
  }
`;

const HistoryItem = styled(List.Item)<{ $active: boolean }>`
  padding: 10px !important;
  background-color: ${({ $active }) => ($active ? '#333' : 'transparent')};
  border-left: ${({ $active }) =>
    $active ? '5px solid #2196F3' : '5px solid transparent'};

  &:hover {
    background-color: #575757;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

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

const Title = styled.span`
  font-size: 18px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
`;

const StyledTextArea = styled(TextArea)`
  max-width: 90% !important;
`;

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
  messages: ConversationHistory;
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  activeModel,
  messages,
  setMessages,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [histories, setHistories] = useState<ConversationHistoryList>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingHistoryID, setEditingHistoryID] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      callApi('getHistories', activeModel)
        .then((histories) => {
          setHistories(histories as ConversationHistoryList);
          setIsLoading(false);
        })
        .catch((error) => {
          callApi(
            'alertMessage',
            `Failed to load histories: ${error}`,
            'error',
          ).catch(console.error);
          setIsLoading(false);
        });
    }
  }, [isOpen, activeModel]);

  const switchHistory = (historyID: string) => {
    if (historyID === messages.root) return;

    setIsLoading(true);
    callApi('switchHistory', activeModel, historyID)
      .then(() => callApi('getLanguageModelConversationHistory', activeModel))
      .then((history) => {
        setMessages(history);
        setIsLoading(false);
      })
      .catch((error) => {
        callApi(
          'alertMessage',
          `Failed to switch history: ${error}`,
          'error',
        ).catch(console.error);
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
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to delete history: ${error}`,
          'error',
        ).catch(console.error),
      );
  };

  const handleTitleDoubleClick = (historyID: string, title: string) => {
    setEditingHistoryID(historyID);
    setTitleInput(title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleBlur = (historyID: string) => {
    callApi('updateHistoryTitleById', activeModel, historyID, titleInput)
      .then(() => {
        setHistories((prevHistories) => ({
          ...prevHistories,
          [historyID]: {
            ...prevHistories[historyID],
            title: titleInput,
          },
        }));
      })
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to update title: ${error}`,
          'error',
        ).catch(console.error),
      );
    setEditingHistoryID(null);
  };

  return (
    <StyledDrawer
      title='Chat History'
      open={isOpen}
      onClose={onClose}
      placement={'left'}
      loading={isLoading}
    >
      {Object.keys(histories).length === 0 ? (
        <NoHistoryMessageContainer>
          <Typography.Text>Nothing Currently</Typography.Text>
        </NoHistoryMessageContainer>
      ) : (
        <List>
          {Object.keys(histories).map(
            (historyID) =>
              historyID !== '' && (
                <HistoryItem
                  key={historyID}
                  onClick={() => switchHistory(historyID)}
                  $active={historyID === messages.root}
                >
                  {editingHistoryID === historyID ? (
                    <StyledTextArea
                      value={titleInput}
                      onChange={handleTitleChange}
                      onBlur={() => handleTitleBlur(historyID)}
                      onSubmit={() => handleTitleBlur(historyID)}
                      autoSize={{ minRows: 1, maxRows: 10 }}
                      autoFocus
                    />
                  ) : (
                    <Title
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleTitleDoubleClick(
                          historyID,
                          histories[historyID].title,
                        );
                      }}
                    >
                      {histories[historyID].title}
                    </Title>
                  )}
                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistory(historyID);
                    }}
                  >
                    <DeleteOutlined />
                  </DeleteButton>
                </HistoryItem>
              ),
          )}
        </List>
      )}
    </StyledDrawer>
  );
};
