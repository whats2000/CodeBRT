import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, Menu, Typography, Input, Spin, Flex, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import type {
  ConversationHistory,
  ConversationHistoryList,
  ModelType,
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

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType | 'loading...';
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

      if (activeModel === 'loading...') {
        return;
      }

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

    if (activeModel === 'loading...') {
      return;
    }

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
    if (activeModel === 'loading...') {
      return;
    }

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
    if (activeModel === 'loading...') {
      return;
    }

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
                {histories[historyID].title}
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
        <Menu selectedKeys={[messages.root]} mode='inline' items={items} />
      )}
    </StyledDrawer>
  );
};
