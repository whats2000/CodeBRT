import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Spin, theme } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type { ConversationEntry } from '../../../types';
import type { RootState } from '../../redux';
import { WebviewContext } from '../../WebviewContext';
import { TopToolBar } from './MessagesContainer/TopToolBar';
import { ImageContainer } from './MessagesContainer/ImageContainer';
import { TextContainer } from './MessagesContainer/TextContainer';
import { TextEditContainer } from './MessagesContainer/TextEditContainer';
import { MessageFloatButton } from './MessagesContainer/MessageFloatButton';
import { useWindowSize } from '../../hooks';
import { updateEntryMessage } from '../../redux/slices/conversationSlice';

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

const StyledMessagesContainer = styled.div<{ $isLoading: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px 0 10px 10px;
  border-top: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  animation: ${(props) =>
      props.$isLoading ? fadeOutAnimation : fadeInAnimation}
    0.25s ease-in-out;
`;

const MessageBubble = styled.div<{ $user: string }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ $user, theme }) =>
    $user === 'user' ? theme.colorBgLayout : theme.colorBgElevated};
  border-radius: 15px;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  padding: 8px 15px;
  margin: 10px 55px 10px 0;
  color: ${({ theme }) => theme.colorText};
  position: relative;
`;

const traverseHistory = (
  entries: { [key: string]: ConversationEntry },
  current: string,
): ConversationEntry[] => {
  const entryStack = [];
  let currentEntry = entries[current];

  while (currentEntry) {
    entryStack.push(currentEntry);
    if (currentEntry.parent) {
      currentEntry = entries[currentEntry.parent];
    } else {
      break;
    }
  }

  return entryStack.reverse();
};

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

    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editedMessage, setEditedMessage] = useState('');
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isStopAudio, setIsStopAudio] = useState(false);
    const [copied, setCopied] = useState<Record<string, boolean>>({});
    const [partialSettings, setPartialSettings] = useState<{
      hljsTheme: keyof typeof hljs;
    }>({ hljsTheme: 'darcula' });
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

    const { token } = theme.useToken();
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
      Object.keys(partialSettings).map(async (key) => {
        try {
          let value = await callApi(
            'getSetting',
            key as keyof typeof partialSettings,
          );
          setPartialSettings((prev) => ({ ...prev, [key]: value }));
        } catch (e) {
          console.error(`Failed to fetch setting ${key}:`, e);
        }
      });
    }, []);

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
    }, [isProcessing, conversationHistoryEntries, isAutoScroll]);

    const scrollToBottom = () => {
      if (virtualListRef.current) {
        virtualListRef.current.scrollToIndex({
          index: 'LAST',
          behavior: 'auto',
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

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const input = e.target;
      setEditedMessage(input.value);
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
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

    const handleSaveEdit = async (entryId: string) => {
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

    const handleMouseEnter = (
      e: React.MouseEvent<HTMLDivElement>,
      entry: ConversationEntry,
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredBubble({ current: e.currentTarget as HTMLDivElement, entry });
      setShowFloatButtons(!(rect.height < 225 || rect.top > 72));
    };

    const setHljsTheme = (theme: keyof typeof hljs) => {
      setPartialSettings((prev) => ({ ...prev, hljsTheme: theme }));
      callApi('setSetting', 'hljsTheme', theme).catch((error) =>
        callApi(
          'alertMessage',
          `Failed to set hljs theme: ${error}`,
          'error',
        ).catch(console.error),
      );
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
      const entry = conversationHistoryEntries[index];
      return (
        <MessageBubble
          key={entry.id}
          $user={entry.role}
          theme={token}
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
        >
          <Virtuoso
            onScroll={handleUserScroll}
            ref={virtualListRef}
            totalCount={conversationHistoryEntries.length}
            itemContent={(index) => renderMessage(index)}
            initialTopMostItemIndex={conversationHistoryEntries.length - 1}
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
            handleEdit={handleEdit}
            handleConvertTextToVoice={handleConvertTextToVoice}
            copied={copied}
            handleCopy={handleCopy}
          />
        )}
      </>
    );
  },
);
