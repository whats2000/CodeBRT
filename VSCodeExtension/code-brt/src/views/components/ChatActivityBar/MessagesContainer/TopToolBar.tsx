import React from 'react';
import { Button, Flex, theme, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyFilled,
  CopyOutlined,
  EditOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import type {
  ConversationEntry,
  ConversationHistory,
  ModelServiceType,
} from '../../../../types';

const RespondCharacter = styled(Typography.Text)<{ $user: string }>`
  color: ${({ $user, theme }) =>
    $user === 'user' ? theme.colorPrimary : theme.colorSecondary};
  font-weight: bold;
  margin-bottom: 5px;
`;

type MessagesTopToolBarProps = {
  modelType: ModelServiceType | 'loading...';
  conversationHistory: ConversationHistory;
  setConversationHistory: React.Dispatch<
    React.SetStateAction<ConversationHistory>
  >;
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
  isProcessing: boolean;
};

export const TopToolBar: React.FC<MessagesTopToolBarProps> = ({
  modelType,
  conversationHistory,
  setConversationHistory,
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
  isProcessing,
}) => {
  const { token } = theme.useToken();

  const entry = conversationHistoryEntries[index];
  const top = conversationHistory.top;
  const topCount = top.length;
  const topIndex = top.indexOf(conversationHistoryEntries[0]?.id);

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
      while (nextEntry.children.length > 0) {
        nextEntry = conversationHistory.entries[nextEntry.children[0]];
      }

      setConversationHistory((prevMessages) => ({
        ...prevMessages,
        current: nextEntry.id,
      }));
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
        nextEntry = history.entries[nextEntry.children[0]];
      }

      setConversationHistory((prevMessages) => ({
        ...prevMessages,
        current: nextEntry.id,
      }));
    }
  };

  return (
    <Flex align={'center'} justify={'space-between'}>
      <RespondCharacter $user={entry.role} theme={token}>
        {entry.role === 'AI'
          ? modelType.charAt(0).toUpperCase() + modelType.slice(1)
          : 'You'}
      </RespondCharacter>
      <Flex gap={1}>
        {parent && siblingCount > 1 && (
          <>
            <Button
              onClick={() => handleGoForward(entry, 'prev')}
              type={'text'}
              disabled={currentIndex === 1 || isProcessing}
            >
              <ArrowLeftOutlined />
            </Button>
            <Button type={'text'}>
              {currentIndex}/{siblingCount}
            </Button>
            <Button
              onClick={() => handleGoForward(entry, 'next')}
              type={'text'}
              disabled={currentIndex === siblingCount || isProcessing}
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
              disabled={topIndex === 0 || isProcessing}
            >
              <ArrowLeftOutlined />
            </Button>
            <Button type={'text'}>
              {topIndex + 1}/{topCount}
            </Button>
            <Button
              onClick={() => handleSwitchRoot(conversationHistory, 'next')}
              type={'text'}
              disabled={topIndex === topCount - 1 || isProcessing}
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
                <PauseCircleOutlined />
              ) : (
                <SoundOutlined />
              )
            }
            type={'text'}
            onClick={() => handleConvertTextToVoice(entry.message)}
            disabled={isStopAudio}
          />
        </Tooltip>
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
    </Flex>
  );
};
