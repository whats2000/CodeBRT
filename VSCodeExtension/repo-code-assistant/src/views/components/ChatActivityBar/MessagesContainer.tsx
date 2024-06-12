import React, { useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RendererCode } from '../common/RenderCode';
import styled, { keyframes } from 'styled-components';
import { WebviewContext } from '../../WebviewContext';
import {
  ConversationEntry,
  ConversationHistory,
} from '../../../types/conversationHistory';
import { ModelType } from '../../../types/modelType';
import { TypingAnimation } from '../common/TypingAnimation';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyFilled,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, Space, Spin, Typography, theme, Input, Flex } from 'antd';

const { useToken } = theme;

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const fadeOut = keyframes`
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
`;

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
    $user === 'user' ? theme.colorBgContainer : theme.colorBgElevated};
  border-radius: 15px;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  padding: 8px 15px;
  margin: 10px 0;
  color: ${({ theme }) => theme.colorText};
  position: relative;
`;

const RespondCharacter = styled(Typography.Text)<{ $user: string }>`
  color: ${({ $user, theme }) =>
    $user === 'user' ? theme.colorPrimary : theme.colorSecondary};
  font-weight: bold;
  margin-bottom: 5px;
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

const MessageImage = styled.img`
  max-width: 100%;
  border-radius: 10px;
  margin-top: 10px;
`;

interface MessagesContainerProps {
  setMessages: React.Dispatch<React.SetStateAction<ConversationHistory>>;
  modelType: ModelType | 'loading...';
  isActiveModelLoading: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messages: ConversationHistory;
  isLoading: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  messageEndRef: React.RefObject<HTMLDivElement>;
  handleEditUserMessageSave: (
    entryId: string,
    editedMessage: string,
  ) => Promise<void>;
}

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
  setMessages,
  modelType,
  isActiveModelLoading,
  messagesContainerRef,
  messages,
  isLoading,
  scrollToBottom,
  messageEndRef,
  handleEditUserMessageSave,
}) => {
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const { callApi } = useContext(WebviewContext);
  const { token } = useToken();

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      for (const entry of Object.values(messages.entries)) {
        if (entry.images) {
          for (const image of entry.images) {
            urls[image] = await callApi('getWebviewUri', image);
          }
        }
      }
      setImageUrls(urls);
    };

    loadImageUrls().then();
  }, [messages.entries, callApi]);

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

    if (messages.entries[entryId].role === 'user') {
      await handleEditUserMessageSave(entryId, editedMessage);
    } else {
      callApi(
        'editLanguageModelConversationHistory',
        modelType,
        entryId,
        editedMessage,
      )
        .then(() => {
          const updatedEntries = { ...messages.entries };
          updatedEntries[entryId].message = editedMessage;
          setMessages((prevMessages) => ({
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

  const handleGoForward = (
    entry: ConversationEntry,
    direction: 'next' | 'prev',
  ) => {
    const parent = entry.parent ? messages.entries[entry.parent] : null;
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
      let nextEntry = messages.entries[nextChildId];

      // Navigate to the leftmost leaf node
      while (nextEntry.children.length > 0) {
        nextEntry = messages.entries[nextEntry.children[0]];
      }

      setMessages((prevMessages) => ({
        ...prevMessages,
        current: nextEntry.id,
      }));
    }
  };

  const conversationHistory = traverseHistory(
    messages.entries,
    messages.current,
  );

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
        {conversationHistory.map((entry) => {
          const parent = entry.parent ? messages.entries[entry.parent] : null;
          const siblingCount = parent ? parent.children.length : 0;
          const currentIndex = parent
            ? parent.children.indexOf(entry.id) + 1
            : 0;

          return (
            <MessageBubble key={entry.id} $user={entry.role} theme={token}>
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
                  {messages.root !== entry.id && messages.root !== '' && (
                    <Button
                      icon={<EditOutlined />}
                      type={'text'}
                      onClick={() =>
                        editingEntryId === entry.id
                          ? handleCancelEdit()
                          : handleEdit(entry.id, entry.message)
                      }
                    />
                  )}
                  <Button
                    onClick={() => handleCopy(entry.message, entry.id)}
                    type={'text'}
                  >
                    {copied[entry.id] ? <CopyFilled /> : <CopyOutlined />}
                  </Button>
                </Flex>
              </Flex>

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
                    entry.id === messages.current &&
                    isLoading ? (
                      <TypingAnimation
                        message={entry.message}
                        isLoading={isLoading}
                        scrollToBottom={scrollToBottom}
                      />
                    ) : (
                      <ReactMarkdown
                        components={RendererCode}
                        children={entry.message}
                      />
                    )}
                  </MessageText>
                  {entry.images &&
                    entry.images.map((image, index) => (
                      <MessageImage
                        key={index}
                        src={imageUrls[image] || image}
                        alt='Referenced Image'
                      />
                    ))}
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
