import React from 'react';
import { Button, Flex, theme, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyFilled,
  CopyOutlined,
  EditOutlined,
  LoadingOutlined,
  RedoOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { ConversationEntry, ConversationHistory } from '../../../../types';
import type { RootState } from '../../../redux';
import { updateCurrentEntry } from '../../../redux/slices/conversationSlice';
import { CancelOutlined } from '../../../icons';

const RespondCharacter = styled(Typography.Text)<{ $user: string }>`
  color: ${({ $user, theme }) =>
    $user === 'user' ? theme.colorPrimary : theme.colorSecondary};
  font-weight: bold;
  margin-bottom: 5px;
`;

type MessagesTopToolBarProps = {
  index: number;
  conversationHistoryEntries: ConversationEntry[];
  isAudioPlaying: boolean;
  isStopAudio: boolean;
  editingEntryId: string | null;
  handleCancelEdit: () => void;
  handleEdit: (entryId: string, message: string) => void;
  handleConvertTextToVoice: (text: string) => void;
  copied: Record<string, boolean>;
  handleCopy: (text: string, entryId: string) => void;
  handleRedo: (entryId: string) => void;
};

export const TopToolBar: React.FC<MessagesTopToolBarProps> = ({
  index,
  conversationHistoryEntries,
  isAudioPlaying,
  isStopAudio,
  editingEntryId,
  handleCancelEdit,
  handleEdit,
  handleConvertTextToVoice,
  copied,
  handleCopy,
  handleRedo,
}) => {
  const { t } = useTranslation('common');
  const { token } = theme.useToken();

  const dispatch = useDispatch();
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { activeModelService } = useSelector(
    (state: RootState) => state.modelService,
  );

  const entry = conversationHistoryEntries[index];
  const top = conversationHistory.top;
  const topCount = top.length;
  const topIndex = top.indexOf(conversationHistoryEntries[0]?.id);

  const isTemp = entry.id.startsWith('temp-');
  const parent = entry.parent
    ? conversationHistory.entries[entry.parent]
    : null;
  const siblingCount = parent ? parent.children.length : 0;
  const currentIndex = parent ? parent.children.indexOf(entry.id) + 1 : 0;

  const handleGoForward = (
    entry: ConversationEntry,
    direction: 'next' | 'prev',
  ) => {
    const parent = entry.parent
      ? conversationHistory.entries[entry.parent]
      : null;
    if (parent && parent.children.length > 0) {
      const currentIndex = parent.children.indexOf(entry.id);
      let nextIndex = currentIndex;

      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % parent.children.length;
      } else if (direction === 'prev') {
        nextIndex =
          (currentIndex - 1 + parent.children.length) % parent.children.length;
      }

      const nextChildId = parent.children[nextIndex];
      let nextEntry = conversationHistory.entries[nextChildId];

      // Navigate to the leftmost leaf node
      while (nextEntry?.children?.length > 0) {
        if (!conversationHistory.entries[nextEntry.children[0]]) {
          break;
        }
        nextEntry = conversationHistory.entries[nextEntry.children[0]];
      }
      dispatch(updateCurrentEntry(nextEntry.id));
    }
  };

  const handleSwitchRoot = (
    history: ConversationHistory,
    direction: 'next' | 'prev',
  ) => {
    if (history.top.length > 0) {
      const currentIndex = history.top.indexOf(
        conversationHistoryEntries[0]?.id,
      );
      let nextIndex = currentIndex;

      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % history.top.length;
      } else if (direction === 'prev') {
        nextIndex =
          (currentIndex - 1 + history.top.length) % history.top.length;
      }

      // Navigate to the leftmost leaf node and set it as the current entry
      const nextRootId = history.top[nextIndex];
      let nextEntry = history.entries[nextRootId];
      while (nextEntry?.children?.length > 0) {
        if (!history.entries[nextEntry.children[0]]) {
          break;
        }
        nextEntry = history.entries[nextEntry.children[0]];
      }
      dispatch(updateCurrentEntry(nextEntry?.id));
    }
  };

  let displayRole: string;
  switch (entry.role) {
    case 'user':
      displayRole = 'You';
      break;
    case 'AI':
      displayRole = entry.modelName
        ? entry.modelName.charAt(0).toUpperCase() + entry.modelName.slice(1)
        : activeModelService.charAt(0).toUpperCase() +
          activeModelService.slice(1);
      break;
    case 'tool':
      const toolResponseName = entry.toolResponses?.[0].toolCallName;
      if (!toolResponseName) {
        displayRole = 'Tool';
      } else {
        const localeToolName = t(`toolNames.${toolResponseName}`);
        displayRole =
          localeToolName === `toolNames.${toolResponseName}`
            ? toolResponseName.charAt(0).toUpperCase() +
              toolResponseName.slice(1)
            : `${localeToolName} (${toolResponseName})`;
      }
      break;
    default:
      displayRole = entry.role;
      break;
  }

  return (
    <Flex align={'center'} justify={'space-between'}>
      <RespondCharacter $user={entry.role} theme={token}>
        {displayRole}
      </RespondCharacter>
      {entry.role !== 'tool' && (
        <Flex gap={1} wrap={true} justify={'flex-end'}>
          {parent && siblingCount > 1 && (
            <>
              <Button
                onClick={() => handleGoForward(entry, 'prev')}
                type={'text'}
                disabled={
                  currentIndex === 1 || conversationHistory.isProcessing
                }
              >
                <ArrowLeftOutlined />
              </Button>
              <Button type={'text'}>
                {isTemp
                  ? `${siblingCount + 1}/${siblingCount + 1}`
                  : `${currentIndex}/${siblingCount}`}
              </Button>
              <Button
                onClick={() => handleGoForward(entry, 'next')}
                type={'text'}
                disabled={
                  currentIndex === siblingCount ||
                  conversationHistory.isProcessing
                }
              >
                <ArrowRightOutlined />
              </Button>
            </>
          )}
          {topCount > 1 && index === 0 && (
            <>
              <Button
                onClick={() => handleSwitchRoot(conversationHistory, 'prev')}
                type={'text'}
                disabled={topIndex === 0 || conversationHistory.isProcessing}
              >
                <ArrowLeftOutlined />
              </Button>
              <Button type={'text'}>
                {topIndex + 1}/{topCount}
              </Button>
              <Button
                onClick={() => handleSwitchRoot(conversationHistory, 'next')}
                type={'text'}
                disabled={
                  topIndex === topCount - 1 || conversationHistory.isProcessing
                }
              >
                <ArrowRightOutlined />
              </Button>
            </>
          )}
          <Tooltip
            title={
              isAudioPlaying
                ? 'Stop audio, these will take a few seconds in current version'
                : ''
            }
          >
            <Button
              icon={
                isStopAudio ? (
                  <LoadingOutlined spin={true} />
                ) : isAudioPlaying ? (
                  <CancelOutlined />
                ) : (
                  <SoundOutlined />
                )
              }
              type={'text'}
              onClick={() => handleConvertTextToVoice(entry.message)}
              disabled={isStopAudio}
            />
          </Tooltip>
          {entry.role === 'AI' && (
            <Button
              icon={
                conversationHistory.isProcessing ? (
                  <LoadingOutlined spin={true} />
                ) : (
                  <RedoOutlined />
                )
              }
              type={'text'}
              disabled={conversationHistory.isProcessing}
              onClick={() => handleRedo(entry.id)}
            />
          )}
          <Button
            icon={<EditOutlined />}
            type={'text'}
            onClick={() =>
              editingEntryId === entry.id
                ? handleCancelEdit()
                : handleEdit(entry.id, entry.message)
            }
          />
          <Button
            icon={copied[entry.id] ? <CopyFilled /> : <CopyOutlined />}
            onClick={() => handleCopy(entry.message, entry.id)}
            type={'text'}
          />
        </Flex>
      )}
    </Flex>
  );
};
