import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Spin, theme } from 'antd';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type {
  ConversationEntry,
  ConversationHistory,
  ModelServiceType,
} from '../../../types';
import { fadeIn, fadeOut } from '../../styles';
import { WebviewContext } from '../../WebviewContext';
import { TopToolBar } from './MessagesContainer/TopToolBar';
import { ImageContainer } from './MessagesContainer/ImageContainer';
import { TextContainer } from './MessagesContainer/TextContainer';
import { TextEditContainer } from './MessagesContainer/TextEditContainer';
import { MessageFloatButton } from './MessagesContainer/MessageFloatButton';

const StyledMessagesContainer = styled.div<{ $isActiveModelLoading: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px 55px 10px 10px;
  border-top: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  animation: ${(props) => (props.$isActiveModelLoading ? fadeOut : fadeIn)} 0.5s
    ease-in-out;
`;

const MessageBubble = styled.div<{ $user: string }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ $user, theme }) =>
    $user === 'user' ? theme.colorBgLayout : theme.colorBgElevated};
  border-radius: 15px;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  padding: 8px 15px;
  margin: 10px 0;
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
  conversationHistory: ConversationHistory;
  setConversationHistory: React.Dispatch<
    React.SetStateAction<ConversationHistory>
  >;
  modelType: ModelServiceType | 'loading...';
  isActiveModelLoading: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  isProcessing: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
  handleEditUserMessageSave: (
    entryId: string,
    editedMessage: string,
  ) => Promise<void>;
};

export const MessagesContainer: React.FC<MessagesContainerProps> = ({
  conversationHistory,
  setConversationHistory,
  modelType,
  isActiveModelLoading,
  messagesContainerRef,
  isProcessing,
  scrollToBottom,
  messageEndRef,
  handleEditUserMessageSave,
}) => {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isStopAudio, setIsStopAudio] = useState(false);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [partialSettings, setPartialSettings] = useState<{
    hljsTheme: keyof typeof hljs;
  }>({ hljsTheme: 'darcula' });

  const { callApi } = useContext(WebviewContext);
  const { token } = theme.useToken();

  const [hoveredBubble, setHoveredBubble] = useState<{
    current: HTMLDivElement | null;
    entry: ConversationEntry | null;
  }>({
    current: null,
    entry: null,
  });
  const [bubblePosition, setBubblePosition] = useState<{
    xRight: number;
    yTop: number;
  }>({ xRight: 0, yTop: 0 });

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
    setEditingEntryId(null);
    setHoveredBubble({ current: null, entry: null });
  }, [modelType]);

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
    if (modelType === 'loading...') return;

    if (conversationHistory.entries[entryId].role === 'user') {
      await handleEditUserMessageSave(entryId, editedMessage);
    } else {
      callApi(
        'editLanguageModelConversationHistory',
        modelType,
        entryId,
        editedMessage,
      )
        .then(() => {
          const updatedEntries = { ...conversationHistory.entries };
          updatedEntries[entryId].message = editedMessage;
          setConversationHistory((prevMessages) => ({
            ...prevMessages,
            entries: updatedEntries,
          }));
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
    const bubble = e.currentTarget as HTMLDivElement;
    const rect = bubble.getBoundingClientRect();
    setHoveredBubble({ current: bubble, entry });
    setBubblePosition({ xRight: rect.right, yTop: rect.top });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (hoveredBubble.current) {
        const rect = hoveredBubble.current.getBoundingClientRect();
        setBubblePosition({ xRight: rect.right, yTop: rect.top });
      }
    };

    messagesContainerRef.current?.addEventListener('scroll', handleScroll);

    return () => {
      messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [hoveredBubble, messagesContainerRef]);

  const conversationHistoryEntries = traverseHistory(
    conversationHistory.entries,
    conversationHistory.current,
  );

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
          () => setCopied((prevState) => ({ ...prevState, [entryId]: false })),
          2000,
        );
      })
      .catch((err) => console.error('Failed to copy text: ', err));
  };

  return (
    <>
      {isActiveModelLoading && (
        <Spin fullscreen={true} size={'large'}>
          <span>Loading conversation history...</span>
        </Spin>
      )}
      <StyledMessagesContainer
        $isActiveModelLoading={isActiveModelLoading}
        ref={messagesContainerRef}
      >
        {conversationHistoryEntries.map((entry, index) => {
          return (
            <MessageBubble
              key={entry.id}
              $user={entry.role}
              theme={token}
              onMouseEnter={(e) => handleMouseEnter(e, entry)}
            >
              <TopToolBar
                modelType={modelType}
                conversationHistory={conversationHistory}
                setConversationHistory={setConversationHistory}
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
                    scrollToBottom={scrollToBottom}
                    hljsTheme={partialSettings.hljsTheme}
                    setHljsTheme={setHljsTheme}
                  />
                  <ImageContainer entry={entry} />
                </div>
              )}
            </MessageBubble>
          );
        })}
        <div ref={messageEndRef} />
      </StyledMessagesContainer>
      {hoveredBubble && (
        <MessageFloatButton
          hoveredBubble={hoveredBubble}
          bubblePosition={bubblePosition}
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
};
