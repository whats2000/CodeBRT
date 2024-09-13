import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { GlobalToken, theme } from 'antd';
import { Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import type { ConversationEntry } from '../../../types';
import type { RootState } from '../../redux';
import { updateEntryMessage } from '../../redux/slices/conversationSlice';
import { WebviewContext } from '../../WebviewContext';
import { useWindowSize } from '../../hooks';
import { traverseHistory } from '../../utils';
import { MessageFloatButton } from './MessagesContainer/MessageFloatButton';
import { MessageItem } from './MessagesContainer/MessageItem';

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOutAnimation = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const StyledMessagesContainer = styled.div<{
  $isLoading: boolean;
  $token: GlobalToken;
}>`
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px 0 10px 10px;
  border-top: 1px solid ${({ $token }) => $token.colorBorderSecondary};
  border-bottom: 1px solid ${({ $token }) => $token.colorBorderSecondary};
  animation: ${(props) =>
      props.$isLoading ? fadeOutAnimation : fadeInAnimation}
    0.25s ease-in-out;
`;

type MessagesContainerProps = {
  isProcessing: boolean;
  processMessage: ({
    message,
    parentId,
    files,
    isEdited,
  }: {
    message: string;
    parentId: string;
    files?: string[];
    isEdited?: boolean;
  }) => Promise<void>;
};

export const MessagesContainer = React.memo<MessagesContainerProps>(
  ({ isProcessing, processMessage }) => {
    const { callApi, addListener, removeListener } = useContext(WebviewContext);
    const token = theme.useToken().token;

    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editedMessage, setEditedMessage] = useState('');
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isStopAudio, setIsStopAudio] = useState(false);
    const [copied, setCopied] = useState<Record<string, boolean>>({});
    const [hoveredBubble, setHoveredBubble] = useState<{
      current: HTMLDivElement | null;
      entry: ConversationEntry | null;
    }>({
      current: null,
      entry: null,
    });
    const [floatButtonsXPosition, setFloatButtonsXPosition] = useState(0);
    const [showFloatButtons, setShowFloatButtons] = useState(false);
    const [toolStatus, setToolStatus] = useState<string>('');
    const [isAutoScroll, setIsAutoScroll] = useState(true);

    const virtualListRef = useRef<VirtuosoHandle>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();
    const conversationHistory = useSelector(
      (state: RootState) => state.conversation,
    );
    const { activeModelService, isLoading } = useSelector(
      (state: RootState) => state.modelService,
    );
    const conversationHistoryEntries = React.useMemo(() => {
      if (!conversationHistory.entries) return [];
      return traverseHistory(
        conversationHistory.entries,
        conversationHistory.current,
      );
    }, [conversationHistory.entries, conversationHistory.current]);

    const { innerWidth } = useWindowSize();

    useEffect(() => {
      addListener('updateStatus', handleUpdateStatus);

      return () => {
        removeListener('updateStatus', handleUpdateStatus);
      };
    }, []);

    useEffect(() => {
      setShowFloatButtons(false);
      setFloatButtonsXPosition(innerWidth - 84);
    }, [innerWidth]);

    useEffect(() => {
      setHoveredBubble({
        current: null,
        entry: null,
      });
    }, [conversationHistory.current]);

    useEffect(() => {
      const handleScrollEnd = () => {
        if (hoveredBubble.current) {
          const rect = hoveredBubble.current.getBoundingClientRect();
          setShowFloatButtons(!(rect.height < 225 || rect.top > 72));
        }
      };

      const messagesContainer = messagesContainerRef.current;
      messagesContainer?.addEventListener('scrollend', handleScrollEnd);

      return () => {
        messagesContainer?.removeEventListener('scrollend', handleScrollEnd);
      };
    }, [hoveredBubble]);

    useEffect(() => {
      if (isAutoScroll && isProcessing) {
        scrollToBottom();
      }
    }, [
      isProcessing,
      conversationHistoryEntries[conversationHistoryEntries.length - 1]
        ?.message,
      isAutoScroll,
    ]);

    const scrollToBottom = () => {
      if (virtualListRef.current) {
        virtualListRef.current.scrollToIndex({
          index: 'LAST',
          behavior: 'smooth',
          align: 'end',
        });
      }
    };

    // Disable auto-scroll if the user scrolls up
    const handleUserScroll = (e: React.UIEvent) => {
      const scrollContainer = e.currentTarget;
      const currentScrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      if (currentScrollTop + clientHeight < scrollHeight - 100) {
        setIsAutoScroll(false);
      }
    };

    const handleAtBottomStateChange = (atBottom: boolean) => {
      if (atBottom) {
        setIsAutoScroll(true);
      }
    };

    const handleEditUserMessageSave = async (
      entryId: string,
      editedMessage: string,
    ) => {
      const entry = conversationHistory.entries[entryId];
      await processMessage({
        message: editedMessage,
        parentId: entry.parent ?? '',
        files: entry.images,
        isEdited: true,
      });
    };

    const handleUpdateStatus = (status: string) => {
      setToolStatus(status);
    };

    const handleEdit = (entryId: string, message: string) => {
      setEditingEntryId(entryId);
      setEditedMessage(message);
      setTimeout(() => {
        const input: HTMLTextAreaElement | null = document.querySelector(
          `#edit-input-${entryId}`,
        );
        if (input) {
          input.style.height = `${input.scrollHeight}px`;
        }
      }, 0);
    };

    const handleSaveEdit = async (entryId: string, editedMessage: string) => {
      if (activeModelService === 'loading...') return;

      if (conversationHistory.entries[entryId].role === 'user') {
        await handleEditUserMessageSave(entryId, editedMessage);
      } else {
        callApi('editLanguageModelConversationHistory', entryId, editedMessage)
          .then(() => {
            dispatch(
              updateEntryMessage({ id: entryId, message: editedMessage }),
            );
          })
          .catch((err) => console.error('Failed to save edited message:', err));
      }
      setEditingEntryId(null);
    };

    const handleCancelEdit = () => {
      setEditingEntryId(null);
    };

    const handleConvertTextToVoice = (text: string) => {
      if (isAudioPlaying) {
        setIsStopAudio(true);
        callApi('stopPlayVoice').catch(console.error);
        return;
      }

      setIsAudioPlaying(true);
      callApi('convertTextToVoice', text)
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
            () =>
              setCopied((prevState) => ({ ...prevState, [entryId]: false })),
            2000,
          );
        })
        .catch((err) => console.error('Failed to copy text: ', err));
    };

    // When click redo the AI message mean the user want to re-generate the AI response
    // We simply remove the AI message and re-generate it by editing exactly and save the same user message
    const handleRedo = (entryId: string) => {
      const previousMessageId = conversationHistory.entries[entryId].parent;
      if (!previousMessageId) return;
      const previousMessage = conversationHistory.entries[previousMessageId];
      handleSaveEdit(previousMessage.id, previousMessage.message).catch(
        console.error,
      );
    };

    const renderMessage = (index: number) => {
      return (
        <MessageItem
          index={index}
          conversationHistoryEntries={conversationHistoryEntries}
          isProcessing={isProcessing}
          setHoveredBubble={setHoveredBubble}
          setShowFloatButtons={setShowFloatButtons}
          copied={copied}
          handleCopy={handleCopy}
          editingEntryId={editingEntryId}
          setEditingEntryId={setEditingEntryId}
          editedMessage={editedMessage}
          setEditedMessage={setEditedMessage}
          toolStatus={toolStatus}
          handleEditUserMessageSave={handleEditUserMessageSave}
          handleEdit={handleEdit}
          handleSaveEdit={handleSaveEdit}
          isAudioPlaying={isAudioPlaying}
          isStopAudio={isStopAudio}
          handleConvertTextToVoice={handleConvertTextToVoice}
          handleRedo={handleRedo}
        />
      );
    };

    return (
      <>
        {isLoading && (
          <Spin fullscreen={true} size={'large'}>
            <span>Setting up the model...</span>
          </Spin>
        )}
        {conversationHistory.isLoading && (
          <Spin fullscreen={true} size={'large'}>
            <span>Fetching conversation history...</span>
          </Spin>
        )}
        <StyledMessagesContainer
          $isLoading={conversationHistory.isLoading}
          ref={messagesContainerRef}
          $token={token}
        >
          <Virtuoso
            onWheel={handleUserScroll}
            ref={virtualListRef}
            totalCount={conversationHistoryEntries.length}
            itemContent={(index) => renderMessage(index)}
            initialTopMostItemIndex={conversationHistoryEntries.length - 1}
            followOutput={'smooth'}
            atBottomThreshold={100}
            atBottomStateChange={handleAtBottomStateChange}
          />
        </StyledMessagesContainer>
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
