import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, Menu, Typography, Input, Spin, Flex, Button } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

import type {
  ConversationHistory,
  ConversationHistoryList,
  ModelServiceType,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';

const StyledDrawer = styled(Drawer)`
  & .ant-drawer-header {
    padding: 10px;
  }

  & .ant-drawer-body {
    padding: 0;
  }
`;

const NoHistoryMessageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const EditableTitle = styled(Input.TextArea)`
  max-width: 90% !important;
  margin-right: 10px;
`;

type HistorySidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  activeModelService: ModelServiceType | 'loading...';
  conversationHistory: ConversationHistory;
  setConversationHistory: React.Dispatch<
    React.SetStateAction<ConversationHistory>
  >;
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  activeModelService,
  conversationHistory,
  setConversationHistory,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [histories, setHistories] = useState<ConversationHistoryList>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingHistoryID, setEditingHistoryID] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      if (activeModelService === 'loading...') {
        return;
      }

      callApi('getHistories', activeModelService)
        .then((histories) => {
          const sortedHistories = Object.fromEntries(
            Object.entries(histories).sort(
              ([, a], [, b]) => b.update_time - a.update_time,
            ),
          );
          setHistories(sortedHistories);
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
  }, [isOpen, activeModelService]);

  const switchHistory = (historyID: string) => {
    if (historyID === conversationHistory.root) return;

    setIsLoading(true);

    if (activeModelService === 'loading...') {
      return;
    }

    callApi('switchHistory', activeModelService, historyID)
      .then(() =>
        callApi('getLanguageModelConversationHistory', activeModelService),
      )
      .then((history) => {
        setConversationHistory(history);
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
    if (activeModelService === 'loading...') {
      return;
    }

    callApi('deleteHistory', activeModelService, historyID)
      .then((newConversationHistory) => {
        setHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };
          delete updatedHistories[historyID];
          return updatedHistories;
        });

        setConversationHistory(newConversationHistory);
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
    if (activeModelService === 'loading...') {
      return;
    }

    callApi('updateHistoryTitleById', activeModelService, historyID, titleInput)
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

  const items = Object.keys(histories)
    .map((historyID) => {
      if (historyID === '') return null;

      return {
        key: historyID,
        label: (
          <Flex
            justify={'space-between'}
            align={'center'}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleTitleDoubleClick(historyID, histories[historyID].title);
            }}
          >
            {editingHistoryID === historyID ? (
              <EditableTitle
                value={titleInput}
                onChange={handleTitleChange}
                onBlur={() => handleTitleBlur(historyID)}
                onSubmit={() => handleTitleBlur(historyID)}
                autoSize={{ minRows: 1, maxRows: 10 }}
                autoFocus
              />
            ) : (
              <Typography.Text ellipsis>
                {histories[historyID].title}{' '}
                {historyID === conversationHistory.root && (
                  <Button
                    type='text'
                    size='small'
                    icon={<EditOutlined />}
                    onClick={() =>
                      handleTitleDoubleClick(
                        historyID,
                        histories[historyID].title,
                      )
                    }
                  />
                )}
              </Typography.Text>
            )}
            <Button danger={true} type='text' size='small'>
              <DeleteOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  deleteHistory(historyID);
                }}
              />
            </Button>
          </Flex>
        ),
        onClick: () => switchHistory(historyID),
      };
    })
    .filter((item) => item !== null);

  return (
    <StyledDrawer
      title='Chat History'
      open={isOpen}
      onClose={onClose}
      placement='left'
    >
      {isLoading ? (
        <NoHistoryMessageContainer>
          <Spin size={'large'} />
        </NoHistoryMessageContainer>
      ) : items.length === 0 ? (
        <NoHistoryMessageContainer>
          <Typography.Text>Nothing Currently</Typography.Text>
        </NoHistoryMessageContainer>
      ) : (
        <Menu
          selectedKeys={[conversationHistory.root]}
          mode='inline'
          items={items}
        />
      )}
    </StyledDrawer>
  );
};
