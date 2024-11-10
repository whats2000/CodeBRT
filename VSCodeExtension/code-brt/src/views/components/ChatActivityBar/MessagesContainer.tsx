import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { GlobalToken, theme } from 'antd';
import { Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import type { ConversationEntry } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import {
  processMessage,
  processToolResponse,
  updateEntryMessage,
} from '../../redux/slices/conversationSlice';
import { WebviewContext } from '../../WebviewContext';
import { useWindowSize } from '../../hooks';
import { traverseHistory } from '../../utils';
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
  padding: 10px 0 10px 10px;
  border-top: 1px solid ${({ $token }) => $token.colorBorder};
  border-bottom: 1px solid ${({ $token }) => $token.colorBorder};
  animation: ${(props) =>
      props.$isLoading ? fadeOutAnimation : fadeInAnimation}
    0.25s ease-in-out;
`;

type MessagesContainerProps = {
  tempIdRef: React.MutableRefObject<string | null>;
};

export const MessagesContainer = React.memo<MessagesContainerProps>(
  ({ tempIdRef }) => {
    const { callApi, addListener, removeListener } = useContext(WebviewContext);
    const token = theme.useToken().token;

    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
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
    const [isUserScrolling, setIsUserScrolling] = useState(true);

    const virtualListRef = useRef<VirtuosoHandle>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>();
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
      // Only auto-scroll if isAutoScroll is true and not user scrolling,
      // and there's a new message being processed
      if (
        isAutoScroll &&
        !isUserScrolling &&
        conversationHistory.isProcessing
      ) {
        scrollToBottom();
      }
    }, [
      conversationHistory.isProcessing,
      conversationHistoryEntries[conversationHistoryEntries.length - 1]
        ?.message,
      isAutoScroll,
      isUserScrolling,
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
    const handleUserScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setIsUserScrolling(true);

      const scrollContainer = e.currentTarget;
      const currentScrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      // Disable auto-scroll if user has scrolled up significantly
      if (currentScrollTop + clientHeight < scrollHeight - 100) {
        setIsAutoScroll(false);
      }
    };

    const handleAtBottomStateChange = (atBottom: boolean) => {
      if (atBottom) {
        setIsAutoScroll(true);
        setIsUserScrolling(false);
      }
    };

    const handleEditUserMessageSave = async (
      entryId: string,
      editedMessage: string,
    ) => {
      const entry = conversationHistory.entries[entryId];
      dispatch(
        processMessage({
          message: editedMessage,
          parentId: entry.parent ?? '',
          tempIdRef,
          files: entry.images,
          isEdited: true,
        }),
      );
    };

    const handleUpdateStatus = (status: string) => {
      setToolStatus(status);
    };

    const handleEdit = (entryId: string) => {
      setEditingEntryId(entryId);
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
      const role = conversationHistory.entries[entryId].role;
      if (role === 'user') {
        await handleEditUserMessageSave(entryId, editedMessage);
      } else if (role === 'tool') {
        const toolCallResult =
          conversationHistory.entries[entryId].toolResponses?.[0];
        if (!toolCallResult) return;
        dispatch(
          processToolResponse({
            entry: conversationHistory.entries[entryId],
            tempIdRef,
          }),
        );
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

    const renderMessage = (index: number) => {
      return (
        <MessageItem
          index={index}
          conversationHistoryEntries={conversationHistoryEntries}
          hoveredBubble={hoveredBubble}
          setHoveredBubble={setHoveredBubble}
          setShowFloatButtons={setShowFloatButtons}
          copied={copied}
          handleCopy={handleCopy}
          editingEntryId={editingEntryId}
          setEditingEntryId={setEditingEntryId}
          toolStatus={toolStatus}
          handleEditUserMessageSave={handleEditUserMessageSave}
          handleEdit={handleEdit}
          handleSaveEdit={handleSaveEdit}
          isAudioPlaying={isAudioPlaying}
          isStopAudio={isStopAudio}
          handleConvertTextToVoice={handleConvertTextToVoice}
          floatButtonsXPosition={floatButtonsXPosition}
          showFloatButtons={showFloatButtons}
          tempIdRef={tempIdRef}
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
            style={{ overflowY: 'scroll' }}
          />
        </StyledMessagesContainer>
      </>
    );
  },
);
