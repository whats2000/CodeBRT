import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Drawer,
  List,
  Typography,
  Input,
  Spin,
  Button,
  theme,
  GlobalToken,
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

import type {
  ConversationHistory,
  ConversationHistoryIndexList,
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

const StyledList = styled(List)<{ $token: GlobalToken }>`
  background-color: ${({ $token }) => $token.colorBgContainer};
  padding: 1px 0;
`;

const StyledListItem = styled(List.Item)<{
  $active: boolean;
  $token: GlobalToken;
}>`
  cursor: pointer;
  margin: 4px;
  border-radius: 4px;

  background-color: ${({ $token, $active }) =>
    $active ? $token.colorPrimaryBg : 'transparent'};

  &:hover {
    background-color: ${({ $token, $active }) =>
      $active ? $token.colorPrimaryBg : $token.colorBgTextHover};
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
  const [histories, setHistories] = useState<ConversationHistoryIndexList>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingHistoryID, setEditingHistoryID] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  const { token } = theme.useToken();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);

      if (activeModelService === 'loading...') {
        return;
      }

      callApi('getHistories')
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

    callApi('switchHistory', historyID)
      .then(() => callApi('getCurrentHistory'))
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

    callApi('deleteHistory', historyID)
      .then(async (newConversationHistory) => {
        setHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };
          delete updatedHistories[historyID];
          return updatedHistories;
        });

        setConversationHistory(await newConversationHistory);
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

    callApi('updateHistoryTitleById', historyID, titleInput)
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

  const renderListItem = (historyID: string) => (
    <StyledListItem
      $token={token}
      $active={historyID === conversationHistory.root}
      actions={[
        <Button
          danger={true}
          type='text'
          size='small'
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            deleteHistory(historyID);
          }}
        />,
      ]}
      onClick={() => switchHistory(historyID)}
    >
      <List.Item.Meta
        style={{ paddingLeft: 16 }}
        title={
          editingHistoryID === historyID ? (
            <EditableTitle
              value={titleInput}
              onChange={handleTitleChange}
              onBlur={() => handleTitleBlur(historyID)}
              onSubmit={() => handleTitleBlur(historyID)}
              autoSize={{ minRows: 1, maxRows: 10 }}
              autoFocus
            />
          ) : (
            <Typography.Text
              style={{ width: '100%' }}
              ellipsis
              onDoubleClick={() =>
                handleTitleDoubleClick(historyID, histories[historyID].title)
              }
            >
              {histories[historyID].title}{' '}
              {historyID === conversationHistory.root && (
                <Button
                  type='text'
                  size='small'
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleDoubleClick(
                      historyID,
                      histories[historyID].title,
                    );
                  }}
                />
              )}
            </Typography.Text>
          )
        }
      />
    </StyledListItem>
  );

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
      ) : Object.keys(histories).length === 0 ? (
        <NoHistoryMessageContainer>
          <Typography.Text>Nothing Currently</Typography.Text>
        </NoHistoryMessageContainer>
      ) : (
        <StyledList
          $token={token}
          split={false}
          dataSource={Object.keys(histories)}
          renderItem={(historyID) => renderListItem(historyID as string)}
        />
      )}
    </StyledDrawer>
  );
};
