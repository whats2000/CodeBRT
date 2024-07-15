import React, { useContext, useState } from 'react';
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
import { WebviewContext } from '../../../WebviewContext';

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
  setIsAudioPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isStopAudio: boolean;
  setIsStopAudio: React.Dispatch<React.SetStateAction<boolean>>;
  editingEntryId: string | null;
  handleCancelEdit: () => void;
  handleEdit: (entryId: string, message: string) => void;
};

export const MessagesTopToolBar: React.FC<MessagesTopToolBarProps> = ({
  modelType,
  conversationHistory,
  setConversationHistory,
  index,
  conversationHistoryEntries,
  isAudioPlaying,
  setIsAudioPlaying,
  isStopAudio,
  setIsStopAudio,
  editingEntryId,
  handleCancelEdit,
  handleEdit,
}) => {
  const { callApi } = useContext(WebviewContext);
  const { token } = theme.useToken();

  const [copied, setCopied] = useState<Record<string, boolean>>({});

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

  const handleConvertTextToVoice = (text: string) => {
    if (isAudioPlaying) {
      setIsStopAudio(true);
      callApi('stopPlayVoice', 'gptSoVits').catch(console.error);
      return;
    }

    setIsAudioPlaying(true);
    callApi('convertTextToVoice', 'gptSoVits', text)
      .then(() => {
        setIsAudioPlaying(false);
        setIsStopAudio(false);
      })
      .catch((error: any) => {
        callApi(
          'alertMessage',
          `Failed to convert text to voice: ${error}`,
          'error',
        ).catch(console.error);
        setIsAudioPlaying(false);
        setIsStopAudio(false);
      });
  };

  const handleCopy = (text: string, entryId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied((prevState) => ({ ...prevState, [entryId]: true }));
        setTimeout(
          () => setCopied((prevState) => ({ ...prevState, [entryId]: false })),
          2000,
        );
      })
      .catch((err) => console.error('Failed to copy text: ', err));
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
          <Button
            onClick={() => handleGoForward(entry, 'prev')}
            type={'text'}
            disabled={currentIndex === 1}
          >
            <ArrowLeftOutlined />
          </Button>
        )}
        {parent && siblingCount > 1 && (
          <Button type={'text'}>
            {currentIndex}/{siblingCount}
          </Button>
        )}
        {parent && siblingCount > 1 && (
          <Button
            onClick={() => handleGoForward(entry, 'next')}
            type={'text'}
            disabled={currentIndex === siblingCount}
          >
            <ArrowRightOutlined />
          </Button>
        )}
        {topCount > 1 && index === 0 && (
          <Button
            onClick={() => handleSwitchRoot(conversationHistory, 'prev')}
            type={'text'}
            disabled={topIndex === 0}
          >
            <ArrowLeftOutlined />
          </Button>
        )}
        {topCount > 1 && index === 0 && (
          <Button type={'text'}>
            {topIndex + 1}/{topCount}
          </Button>
        )}
        {topCount > 1 && index === 0 && (
          <Button
            onClick={() => handleSwitchRoot(conversationHistory, 'next')}
            type={'text'}
            disabled={topIndex === topCount - 1}
          >
            <ArrowRightOutlined />
          </Button>
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
