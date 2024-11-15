import React, { useEffect, useState } from 'react';
import type { GlobalToken } from 'antd';
import { theme } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import type { ConversationEntry, Modification } from '../../../../types';
import type { RootState } from '../../../redux';
import { TopToolBar } from './TopToolBar';
import { TextEditContainer } from './TextEditContainer';
import { TextContainer } from './TextContainer';
import { ImageContainer } from './ImageContainer';
import { MessageFloatButton } from './MessageFloatButton';
import { ToolActionContainer } from './ToolActionContainer';
import { ToolResponseContainer } from './ToolResponseContainer';

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
    $user !== 'AI' ? $token.colorBgLayout : $token.colorBgElevated};
  border-radius: 15px;
  border: 1px solid ${({ $token }) => $token.colorBorder};
  padding: 8px 15px;
  color: ${({ $token }) => $token.colorText};
  position: relative;
`;

type MessageItemProps = {
  index: number;
  conversationHistoryEntries: ConversationEntry[];
  hoveredBubble: {
    current: HTMLDivElement | null;
    entry: ConversationEntry | null;
  };
  setHoveredBubble: React.Dispatch<
    React.SetStateAction<{
      current: HTMLDivElement | null;
      entry: ConversationEntry | null;
    }>
  >;
  setShowFloatButtons: React.Dispatch<React.SetStateAction<boolean>>;
  copied: { [key: string]: boolean };
  handleCopy: (text: string, entryId: string) => void;
  editingEntryId: string | null;
  setEditingEntryId: React.Dispatch<React.SetStateAction<string | null>>;
  toolStatus: string;
  handleEditUserMessageSave: (
    entryId: string,
    message: string,
  ) => Promise<void>;
  handleEdit: (entryId: string) => void;
  handleSaveEdit: (entryId: string, message: string) => void;
  isAudioPlaying: boolean;
  isStopAudio: boolean;
  handleConvertTextToVoice: (text: string) => void;
  floatButtonsXPosition: number;
  showFloatButtons: boolean;
  tempIdRef: React.MutableRefObject<string | null>;
  handleOpenApplyChangesAlert: (updatedModifications: Modification[]) => void;
};

export const MessageItem = React.memo<MessageItemProps>(
  ({
    index,
    conversationHistoryEntries,
    hoveredBubble,
    setHoveredBubble,
    setShowFloatButtons,
    copied,
    handleCopy,
    editingEntryId,
    setEditingEntryId,
    toolStatus,
    handleEdit,
    handleSaveEdit,
    isAudioPlaying,
    isStopAudio,
    handleConvertTextToVoice,
    floatButtonsXPosition,
    showFloatButtons,
    tempIdRef,
    handleOpenApplyChangesAlert,
  }) => {
    const token = theme.useToken();
    const entry = conversationHistoryEntries[index];

    const [editedMessage, setEditedMessage] = useState(entry.message);

    const conversationHistory = useSelector(
      (rootState: RootState) => rootState.conversation,
    );

    useEffect(() => {
      setEditedMessage(entry.message);
    }, [entry.id]);

    const handleRedo = (entryId: string) => {
      const previousMessageId = conversationHistory.entries[entryId].parent;
      if (!previousMessageId) return;
      const previousMessage = conversationHistory.entries[previousMessageId];
      handleSaveEdit(previousMessage.id, previousMessage.message);
    };

    const handleMouseEnter = (
      e: React.MouseEvent<HTMLDivElement>,
      entry: ConversationEntry,
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredBubble({ current: e.currentTarget as HTMLDivElement, entry });
      setShowFloatButtons(!(rect.height < 225 || rect.top > 72));
    };

    const handleCancelEdit = () => {
      setEditingEntryId(null);
    };

    const renderContainer = () => {
      if (entry.role === 'tool') {
        return (
          <ToolResponseContainer
            entry={entry}
            toolStatus={toolStatus}
            showActionButtons={
              conversationHistory.current === entry.id &&
              !entry.id.startsWith('temp')
            }
          />
        );
      }
      if (entry.id === editingEntryId) {
        return (
          <TextEditContainer
            entry={entry}
            isProcessing={conversationHistory.isProcessing}
            editedMessage={editedMessage}
            setEditedMessage={setEditedMessage}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
          />
        );
      }
      return (
        <div>
          <TextContainer
            entry={entry}
            isProcessing={conversationHistory.isProcessing}
            conversationHistoryCurrent={conversationHistory.current}
            toolStatus={toolStatus}
            handleOpenApplyChangesAlert={handleOpenApplyChangesAlert}
          />
          <ImageContainer entry={entry} />
          <ToolActionContainer
            entry={entry}
            tempIdRef={tempIdRef}
            showActionButtons={conversationHistory.current === entry.id}
          />
        </div>
      );
    };

    return (
      <>
        <MessageBubbleWrapper
          $paddingBottom={
            index === conversationHistoryEntries.length - 1 &&
            conversationHistory.isProcessing
          }
        >
          <MessageBubble
            key={entry.id}
            $user={entry.role}
            $token={token.token}
            onMouseEnter={(e) => handleMouseEnter(e, entry)}
          >
            <TopToolBar
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
            />
            {renderContainer()}
          </MessageBubble>
        </MessageBubbleWrapper>
        {hoveredBubble && showFloatButtons && (
          <MessageFloatButton
            hoveredBubble={hoveredBubble}
            floatButtonsPosition={{
              xRight: floatButtonsXPosition,
              yTop: innerWidth < 550 ? 115 : 75,
            }}
            isAudioPlaying={isAudioPlaying}
            isStopAudio={isStopAudio}
            editingEntryId={editingEntryId}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            editingMessage={editedMessage}
            handleEdit={handleEdit}
            handleConvertTextToVoice={handleConvertTextToVoice}
            copied={copied}
            handleCopy={handleCopy}
            handleRedo={handleRedo}
          />
        )}
      </>
    );
  },
);
