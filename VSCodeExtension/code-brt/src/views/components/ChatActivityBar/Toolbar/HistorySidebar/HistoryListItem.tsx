import React from 'react';
import {
  Button,
  GlobalToken,
  Input,
  List,
  Space,
  theme,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
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
        {showTags && (
          <HistoryTags
            tags={histories[historyID].tags}
            historyID={historyID}
            setHistories={setHistories}
          />
        )}
      </Space>
    </StyledListItem>
  );
};
