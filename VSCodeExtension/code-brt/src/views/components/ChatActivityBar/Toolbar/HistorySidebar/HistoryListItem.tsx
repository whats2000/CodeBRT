import React from 'react';
import {
  Button,
  Flex,
  GlobalToken,
  Input,
  List,
  Space,
  theme,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import type {
  ConversationHistory,
  ConversationHistoryIndexList,
} from '../../../../../types';
import { HistoryTags } from './HistoryTags';

const StyledListItem = styled(List.Item)<{
  $active: boolean;
  $token: GlobalToken;
}>`
  cursor: pointer;
  margin: 4px;
  padding: 8px 0 !important;
  border-radius: 4px;

  background-color: ${({ $token, $active }) =>
    $active ? $token.colorPrimaryBg : 'transparent'};

  &:hover {
    background-color: ${({ $token, $active }) =>
      $active ? $token.colorPrimaryBg : $token.colorBgTextHover};
  }
`;

const EditableTitle = styled(Input.TextArea)`
  max-width: 90% !important;
  margin-right: 10px;
`;

type HistoryListItemProps = {
  historyID: string;
  conversationHistory: ConversationHistory;
  histories: ConversationHistoryIndexList;
  setHistories: React.Dispatch<
    React.SetStateAction<ConversationHistoryIndexList>
  >;
  deleteHistory: (historyID: string) => void;
  switchHistory: (historyID: string) => void;
  editingHistoryID: string | null;
  titleInput: string;
  handleTitleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleTitleBlur: (historyID: string) => void;
  handleTitleDoubleClick: (historyID: string, title: string) => void;
  showTags: boolean;
};

export const HistoryListItem: React.FC<HistoryListItemProps> = ({
  historyID,
  conversationHistory,
  histories,
  setHistories,
  deleteHistory,
  switchHistory,
  editingHistoryID,
  titleInput,
  handleTitleChange,
  handleTitleBlur,
  handleTitleDoubleClick,
  showTags,
}) => {
  const { token } = theme.useToken();

  return (
    <StyledListItem
      $token={token}
      $active={historyID === conversationHistory.root}
      extra={
        <Button
          danger={true}
          type='text'
          size='small'
          icon={<DeleteOutlined />}
          style={{ marginRight: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            deleteHistory(historyID);
          }}
        />
      }
      onClick={() => switchHistory(historyID)}
    >
      <Space
        size={'small'}
        direction={'vertical'}
        style={{ paddingLeft: 24, width: '100%', maxWidth: '85%' }}
      >
        {editingHistoryID === historyID ? (
          <Flex align={'center'}>
            <EditableTitle
              value={titleInput}
              onChange={handleTitleChange}
              onBlur={() => handleTitleBlur(historyID)}
              onSubmit={() => handleTitleBlur(historyID)}
              autoSize={{ minRows: 1, maxRows: 10 }}
              autoFocus
            />
            <Button type='text' size='small' icon={<SaveOutlined />} />
          </Flex>
        ) : (
          <Flex
            onDoubleClick={() =>
              handleTitleDoubleClick(historyID, histories[historyID].title)
            }
            style={{ width: '100%' }}
            align={'center'}
          >
            <Typography.Text ellipsis>
              {histories[historyID].title}
            </Typography.Text>
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
          </Flex>
        )}
        {showTags && (
          <HistoryTags
            tags={histories[historyID].tags}
            historyID={historyID}
            setHistoryIndexes={setHistories}
          />
        )}
      </Space>
    </StyledListItem>
  );
};
