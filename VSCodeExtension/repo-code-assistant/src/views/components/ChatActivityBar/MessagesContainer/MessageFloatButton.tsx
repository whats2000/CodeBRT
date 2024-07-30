import React from 'react';
import {
  CopyFilled,
  CopyOutlined,
  EditOutlined,
  EllipsisOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  SaveOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { FloatButton } from 'antd';
import type { ConversationEntry } from '../../../../types';

type MessageFloatButtonProps = {
  hoveredBubble: {
    current: HTMLDivElement | null;
    entry: ConversationEntry | null;
  };
  bubblePosition: {
    xRight: number;
    yTop: number;
  };
  isAudioPlaying: boolean;
  isStopAudio: boolean;
  editingEntryId: string | null;
  handleSaveEdit: (entryId: string) => void;
  handleCancelEdit: () => void;
  handleEdit: (entryId: string, message: string) => void;
  handleConvertTextToVoice: (text: string) => void;
  copied: Record<string, boolean>;
  handleCopy: (text: string, entryId: string) => void;
};

export const MessageFloatButton: React.FC<MessageFloatButtonProps> = ({
  hoveredBubble,
  bubblePosition,
  isAudioPlaying,
  isStopAudio,
  editingEntryId,
  handleSaveEdit,
  handleCancelEdit,
  handleEdit,
  handleConvertTextToVoice,
  copied,
  handleCopy,
}) => {
  if (!hoveredBubble.current || !hoveredBubble.entry) return null;

  return (
    <FloatButton.Group
      shape='circle'
      style={{
        left: bubblePosition.xRight + 10,
        top: bubblePosition.yTop > 75 ? bubblePosition.yTop : 75,
        position: 'fixed',
        visibility: hoveredBubble ? 'visible' : 'hidden',
      }}
      icon={<EllipsisOutlined />}
      trigger='hover'
    >
      <FloatButton
        icon={<EditOutlined />}
        onClick={() => {
          if (!hoveredBubble.entry) return;

          editingEntryId === hoveredBubble.entry.id
            ? handleCancelEdit()
            : handleEdit(hoveredBubble.entry.id, hoveredBubble.entry.message);
        }}
      />
      {hoveredBubble.entry.id !== editingEntryId ? (
        <>
          <FloatButton
            icon={
              isStopAudio ? (
                <LoadingOutlined spin={true} />
              ) : isAudioPlaying ? (
                <PauseCircleOutlined />
              ) : (
                <SoundOutlined />
              )
            }
            onClick={() => {
              if (!hoveredBubble.entry || isStopAudio) return;

              handleConvertTextToVoice(hoveredBubble.entry.message);
            }}
          />
          <FloatButton
            icon={
              hoveredBubble.entry && copied[hoveredBubble.entry.id] ? (
                <CopyFilled />
              ) : (
                <CopyOutlined />
              )
            }
            onClick={() => {
              if (!hoveredBubble.entry) return;

              handleCopy(hoveredBubble.entry.message, hoveredBubble.entry.id);
            }}
          />
        </>
      ) : (
        <>
          <FloatButton
            icon={<SaveOutlined />}
            onClick={() => {
              if (!hoveredBubble.entry) return;

              handleSaveEdit(hoveredBubble.entry.id);
            }}
          />
        </>
      )}
    </FloatButton.Group>
  );
};
