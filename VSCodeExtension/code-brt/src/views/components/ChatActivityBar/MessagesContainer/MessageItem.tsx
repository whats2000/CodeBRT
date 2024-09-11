import React from 'react';
import type { GlobalToken } from 'antd';
import { theme } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type { ConversationEntry } from '../../../../types';
import type { RootState } from '../../../redux';
import { TopToolBar } from './TopToolBar';
import { TextEditContainer } from './TextEditContainer';
import { TextContainer } from './TextContainer';
import { ImageContainer } from './ImageContainer';

const MessageBubbleWrapper = styled.div<{
  $paddingBottom: boolean;
}>`
  padding: 10px 55px
    ${({ $paddingBottom }) => ($paddingBottom ? '100px' : '10px')} 0;
`;

const MessageBubble = styled.div<{
  $user: string;
  $token: GlobalToken;
}>`
  display: flex;
  flex-direction: column;
  background-color: ${({ $user, $token }) =>
    $user === 'user' ? $token.colorBgLayout : $token.colorBgElevated};
  border-radius: 15px;
  border: 1px solid ${({ $token }) => $token.colorBorder};
  padding: 8px 15px;
  color: ${({ $token }) => $token.colorText};
  position: relative;
`;

type MessageItemProps = {
  index: number;
  conversationHistoryEntries: ConversationEntry[];
  isProcessing: boolean;
  setHoveredBubble: React.Dispatch<
    React.SetStateAction<{
      current: HTMLDivElement | null;
      entry: ConversationEntry | null;
    }>
  >;
  setShowFloatButtons: React.Dispatch<React.SetStateAction<boolean>>;
  partialSettings: { hljsTheme: keyof typeof hljs };
  setHljsTheme: (theme: keyof typeof hljs) => void;
  copied: { [key: string]: boolean };
  handleCopy: (text: string, entryId: string) => void;
  editingEntryId: string | null;
  setEditingEntryId: React.Dispatch<React.SetStateAction<string | null>>;
  editedMessage: string;
  setEditedMessage: React.Dispatch<React.SetStateAction<string>>;
  toolStatus: string;
  handleEditUserMessageSave: (
    entryId: string,
    message: string,
  ) => Promise<void>;
  handleEdit: (entryId: string, message: string) => void;
  handleSaveEdit: (entryId: string, message: string) => void;
  isAudioPlaying: boolean;
  isStopAudio: boolean;
  handleConvertTextToVoice: (text: string) => void;
  handleRedo: (entryId: string) => void;
};

export const MessageItem = React.memo<MessageItemProps>(
  ({
    index,
    conversationHistoryEntries,
    isProcessing,
    setHoveredBubble,
    setShowFloatButtons,
    partialSettings,
    setHljsTheme,
    copied,
    handleCopy,
    editingEntryId,
    setEditingEntryId,
    editedMessage,
    setEditedMessage,
    toolStatus,
    handleEdit,
    handleSaveEdit,
    isAudioPlaying,
    isStopAudio,
    handleConvertTextToVoice,
    handleRedo,
  }) => {
    const token = theme.useToken();
    const entry = conversationHistoryEntries[index];

    const { activeModelService } = useSelector(
      (rootState: RootState) => rootState.modelService,
    );
    const conversationHistory = useSelector(
      (rootState: RootState) => rootState.conversation,
    );

    const handleMouseEnter = (
      e: React.MouseEvent<HTMLDivElement>,
      entry: ConversationEntry,
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredBubble({ current: e.currentTarget as HTMLDivElement, entry });
      setShowFloatButtons(!(rect.height < 225 || rect.top > 72));
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const input = e.target;
      setEditedMessage(input.value);
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    };

    const handleCancelEdit = () => {
      setEditingEntryId(null);
    };

    return (
      <MessageBubbleWrapper
        $paddingBottom={
          index === conversationHistoryEntries.length - 1 && isProcessing
        }
      >
        <MessageBubble
          key={entry.id}
          $user={entry.role}
          $token={token.token}
          onMouseEnter={(e) => handleMouseEnter(e, entry)}
        >
          <TopToolBar
            modelType={activeModelService}
            index={index}
            conversationHistoryEntries={conversationHistoryEntries}
            isAudioPlaying={isAudioPlaying}
            isStopAudio={isStopAudio}
            editingEntryId={editingEntryId}
            handleCancelEdit={handleCancelEdit}
            handleEdit={handleEdit}
            handleConvertTextToVoice={handleConvertTextToVoice}
            copied={copied}
            handleCopy={handleCopy}
            handleRedo={handleRedo}
            isProcessing={isProcessing}
          />

          {entry.id === editingEntryId ? (
            <TextEditContainer
              entry={entry}
              isProcessing={isProcessing}
              editedMessage={editedMessage}
              handleInput={handleInput}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          ) : (
            <div>
              <TextContainer
                entry={entry}
                conversationHistoryCurrent={conversationHistory.current}
                isProcessing={isProcessing}
                hljsTheme={partialSettings.hljsTheme}
                setHljsTheme={setHljsTheme}
                toolStatus={toolStatus}
              />
              <ImageContainer entry={entry} />
            </div>
          )}
        </MessageBubble>
      </MessageBubbleWrapper>
    );
  },
);
