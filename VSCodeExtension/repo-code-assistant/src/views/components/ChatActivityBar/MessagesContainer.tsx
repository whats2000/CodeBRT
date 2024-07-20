import React, { useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RendererCode, RendererCodeProvider } from '../common/RenderCode';
import styled from 'styled-components';
import {
  Button,
  Input,
  Space,
  Spin,
  theme,
  Typography,
  Image as ImageComponent,
  Flex,
  Card,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';

import type {
  ConversationEntry,
  ConversationHistory,
  ModelServiceType,
} from '../../../types';
import { fadeIn, fadeOut } from '../../styles';
import { WebviewContext } from '../../WebviewContext';
import { TypingAnimation } from '../common/TypingAnimation';
import { MessagesTopToolBar } from './MessagesContainer/MessagesTopToolBar';

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

const EditInputTextArea = styled(Input.TextArea)`
  background-color: transparent;
  color: ${({ theme }) => theme.colorText};
  border: none;
  border-radius: 4px;
  resize: none;
  overflow: hidden;
  margin-top: 10px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colorPrimary};
  }
`;

const MessageText = styled.span`
  word-wrap: break-word;
  margin: 10px 0;
`;

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

const traverseHistory = (
  entries: { [key: string]: ConversationEntry },
  current: string,
) => {
  const history = [];
  let currentEntry = entries[current];

  while (currentEntry) {
    history.push(currentEntry);
    if (currentEntry.parent) {
      currentEntry = entries[currentEntry.parent];
    } else {
      break;
    }
  }

  return history.reverse();
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
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isStopAudio, setIsStopAudio] = useState(false);
  const [partialSettings, setPartialSettings] = useState<{
    hljsTheme: keyof typeof hljs;
  }>({ hljsTheme: 'darcula' });

  const { callApi } = useContext(WebviewContext);
  const { token } = theme.useToken();

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      for (const entry of Object.values(conversationHistory.entries)) {
        if (entry.images) {
          for (const image of entry.images) {
            urls[image] = await callApi('getWebviewUri', image);
          }
        }
      }
      setImageUrls(urls);
    };

    loadImageUrls().then();
  }, [conversationHistory.entries, callApi]);

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
            <MessageBubble key={entry.id} $user={entry.role} theme={token}>
              <MessagesTopToolBar
                modelType={modelType}
                conversationHistory={conversationHistory}
                setConversationHistory={setConversationHistory}
                index={index}
                conversationHistoryEntries={conversationHistoryEntries}
                isAudioPlaying={isAudioPlaying}
                setIsAudioPlaying={setIsAudioPlaying}
                isStopAudio={isStopAudio}
                setIsStopAudio={setIsStopAudio}
                editingEntryId={editingEntryId}
                handleCancelEdit={handleCancelEdit}
                handleEdit={handleEdit}
              />

              {entry.id === editingEntryId ? (
                <Space direction={'vertical'}>
                  <EditInputTextArea
                    id={`edit-input-${entry.id}`}
                    value={editedMessage}
                    onChange={handleInput}
                    autoFocus
                    theme={token}
                  />
                  <Button
                    onClick={() => handleSaveEdit(entry.id)}
                    style={{ width: '100%' }}
                    disabled={isProcessing}
                  >
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} style={{ width: '100%' }}>
                    Cancel
                  </Button>
                </Space>
              ) : (
                <>
                  <MessageText>
                    {entry.role === 'AI' &&
                    entry.id === conversationHistory.current &&
                    isProcessing ? (
                      <TypingAnimation
                        message={entry.message}
                        isProcessing={isProcessing}
                        scrollToBottom={scrollToBottom}
                        hljsTheme={partialSettings.hljsTheme}
                        setHljsTheme={setHljsTheme}
                      />
                    ) : (
                      <RendererCodeProvider
                        value={{
                          hljsTheme: partialSettings.hljsTheme,
                          setHljsTheme: setHljsTheme,
                        }}
                      >
                        <ReactMarkdown
                          components={RendererCode}
                          children={entry.message}
                        />
                      </RendererCodeProvider>
                    )}
                  </MessageText>
                  <ImageComponent.PreviewGroup>
                    <Flex wrap={true}>
                      {entry.images &&
                        entry.images.map((image, index) =>
                          imageUrls[image] !== '' ? (
                            <Card
                              size={'small'}
                              style={{
                                width: '45%',
                                margin: '2.5%',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              key={`${image}-${index}`}
                            >
                              <ImageComponent
                                src={imageUrls[image] || image}
                                alt='Referenced Image'
                              />
                            </Card>
                          ) : (
                            <Typography.Text key={index} type={'warning'}>
                              <WarningOutlined /> Referenced image not found
                            </Typography.Text>
                          ),
                        )}
                    </Flex>
                  </ImageComponent.PreviewGroup>
                </>
              )}
            </MessageBubble>
          );
        })}
        <div ref={messageEndRef} />
      </StyledMessagesContainer>
    </>
  );
};
