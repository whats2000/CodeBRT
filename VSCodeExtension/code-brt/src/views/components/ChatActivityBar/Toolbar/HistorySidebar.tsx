import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { GlobalToken, Select, Tooltip } from 'antd';
import { Drawer, List, Typography, Spin, Button, theme, Flex } from 'antd';
import { TagOutlined } from '@ant-design/icons';

import type {
  ConversationHistory,
  ConversationHistoryIndexList,
  ModelServiceType,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { HistoryListItem } from './HistorySidebar/HistoryListItem';

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

const NoHistoryMessageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
  const [showTags, setShowTags] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

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

  useEffect(() => {
    const tagsAvailable = Object.values(histories).reduce(
      (acc: string[], history) => {
        if (!history.tags) {
          return acc;
        }

        return [...acc, ...history.tags.filter((tag) => !acc.includes(tag))];
      },
      [],
    );

    setAllTags(tagsAvailable);
  }, [histories]);

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

  const getFilteredHistoriesIds = (histories: ConversationHistoryIndexList) => {
    return Object.keys(histories).filter((historyID) =>
      filterTags.length > 0
        ? histories[historyID].tags?.some
          ? histories[historyID].tags.some((tag) => filterTags.includes(tag))
          : false
        : true,
    );
  };

  return (
    <StyledDrawer
      title={
        <Flex justify={'space-between'} align={'center'}>
          <Typography.Text>Chat History</Typography.Text>
          <Tooltip title='Show Tags' placement={'right'}>
            <Button
              type={showTags ? 'primary' : 'default'}
              icon={<TagOutlined />}
              onClick={() => setShowTags((prev) => !prev)}
            />
          </Tooltip>
        </Flex>
      }
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
        <>
          {showTags && (
            <div style={{ padding: 16 }}>
              <Select
                showSearch={true}
                mode={'tags'}
                style={{ width: '100%' }}
                value={filterTags}
                options={allTags
                  .filter((tag) => !filterTags.includes(tag))
                  .map((item) => ({
                    value: item,
                    label: item,
                  }))}
                placeholder={'Filter by tags'}
                onChange={setFilterTags}
              />
            </div>
          )}
          <StyledList
            $token={token}
            split={false}
            dataSource={getFilteredHistoriesIds(histories)}
            renderItem={(historyID) => (
              <HistoryListItem
                historyID={historyID as string}
                conversationHistory={conversationHistory}
                histories={histories}
                setHistories={setHistories}
                deleteHistory={deleteHistory}
                switchHistory={switchHistory}
                editingHistoryID={editingHistoryID}
                titleInput={titleInput}
                handleTitleChange={handleTitleChange}
                handleTitleBlur={handleTitleBlur}
                handleTitleDoubleClick={handleTitleDoubleClick}
                showTags={showTags}
              />
            )}
          />
        </>
      )}
    </StyledDrawer>
  );
};
