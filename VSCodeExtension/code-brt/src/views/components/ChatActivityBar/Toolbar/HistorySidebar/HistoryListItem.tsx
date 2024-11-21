import React, { useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../../../../redux';
import { HistoryTags } from './HistoryTags';
import { deleteConversationIndex } from '../../../../redux/slices/conversationIndexSlice';

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
  switchHistory,
  editingHistoryID,
  titleInput,
  handleTitleChange,
  handleTitleBlur,
  handleTitleDoubleClick,
  showTags,
}) => {
  const { token } = theme.useToken();

  const dispatch = useDispatch<AppDispatch>();
  const activeModelService = useSelector(
    (state: RootState) => state.modelService.activeModelService,
  );
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { historyIndexes } = useSelector(
    (state: RootState) => state.conversationIndex,
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const deleteHistory = async (historyID: string) => {
    if (activeModelService === 'loading...' || isDeleting) {
      return;
    }

    setIsDeleting(true);
    await dispatch(deleteConversationIndex(historyID));
    setIsDeleting(false);
  };

  return (
    <StyledListItem
      $token={token}
      $active={historyID === conversationHistory.root}
      extra={
        <Button
          danger={true}
          type='text'
          size='small'
          loading={isDeleting}
          disabled={isDeleting}
          icon={<DeleteOutlined />}
          style={{ marginRight: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            void deleteHistory(historyID);
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
              handleTitleDoubleClick(historyID, historyIndexes[historyID].title)
            }
            style={{ width: '100%' }}
            align={'center'}
          >
            <Typography.Text ellipsis>
              {historyIndexes[historyID].title}
            </Typography.Text>
            {historyID === conversationHistory.root && (
              <Button
                type='text'
                size='small'
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleDoubleClick(
                    historyID,
                    historyIndexes[historyID].title,
                  );
                }}
              />
            )}
          </Flex>
        )}
        {showTags && (
          <HistoryTags
            tags={historyIndexes[historyID].tags}
            historyID={historyID}
          />
        )}
      </Space>
    </StyledListItem>
  );
};
