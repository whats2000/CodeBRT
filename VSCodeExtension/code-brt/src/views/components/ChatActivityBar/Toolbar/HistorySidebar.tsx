import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GlobalToken, InputRef, Space } from 'antd';
import {
  Drawer,
  List,
  Typography,
  Input,
  Spin,
  Button,
  Tag,
  theme,
  Flex,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  TagOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { TweenOneGroup } from 'rc-tween-one';

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
  const [showTags, setShowTags] = useState(true);
  const [inputVisible, setInputVisible] = useState('');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);

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

  const handleTagClose = (historyID: string, tag: string) => {
    callApi('removeHistoryTag', historyID, tag)
      .then(() => {
        setHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };

          if (!updatedHistories[historyID].tags) {
            return updatedHistories;
          }

          updatedHistories[historyID].tags = updatedHistories[
            historyID
          ].tags.filter((t) => t !== tag);
          return updatedHistories;
        });
      })
      .catch((error) =>
        callApi(
          'alertMessage',
          `Failed to remove tag: ${error}`,
          'error',
        ).catch(console.error),
      );
  };

  const showInput = (historyID: string) => {
    setInputVisible(historyID);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = (historyID: string) => {
    if (inputValue && !histories[historyID].tags?.includes(inputValue)) {
      callApi('addHistoryTag', historyID, inputValue)
        .then(() => {
          setHistories((prevHistories) => {
            const updatedHistories = { ...prevHistories };
            updatedHistories[historyID].tags = [
              ...(updatedHistories[historyID].tags ?? []),
              inputValue,
            ];
            return updatedHistories;
          });
        })
        .catch((error) =>
          callApi('alertMessage', `Failed to add tag: ${error}`, 'error').catch(
            console.error,
          ),
        );
    }
    setInputVisible('');
    setInputValue('');
  };

  const renderTags = (historyID: string) => (
    <Space size={'small'} wrap>
      <TweenOneGroup
        appear={false}
        enter={{ scale: 0.8, opacity: 0, type: 'from', duration: 100 }}
        leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }}
        onEnd={(e: any) => {
          if (e.type === 'appear' || e.type === 'enter') {
            (e.target as any).style = 'display: inline-block';
          }
        }}
      >
        {histories[historyID].tags?.map((tag) => (
          <span key={tag} style={{ display: 'inline-block' }}>
            <Tag
              closable
              onClose={(e) => {
                e.preventDefault();
                handleTagClose(historyID, tag);
              }}
            >
              {tag}
            </Tag>
          </span>
        ))}
      </TweenOneGroup>
      {inputVisible === historyID ? (
        <Input
          ref={inputRef}
          type='text'
          size='small'
          style={{ width: 78 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => handleInputConfirm(historyID)}
          onPressEnter={() => handleInputConfirm(historyID)}
        />
      ) : (
        <Tag
          onClick={() => showInput(historyID)}
          style={{ background: token.colorBgContainer, borderStyle: 'dashed' }}
        >
          <PlusOutlined /> New Tag
        </Tag>
      )}
    </Space>
  );

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
      <Space direction={'vertical'} style={{ padding: '0 16px 0 24px' }}>
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
                  handleTitleDoubleClick(historyID, histories[historyID].title);
                }}
              />
            )}
          </Typography.Text>
        )}
        {showTags && renderTags(historyID)}
      </Space>
    </StyledListItem>
  );

  return (
    <StyledDrawer
      title={
        <Flex justify={'space-between'} align={'center'}>
          <Typography.Text>Chat History</Typography.Text>
          <Button
            type='text'
            danger={showTags}
            icon={<TagOutlined />}
            onClick={() => setShowTags((prev) => !prev)}
          />
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
