import React from 'react';
import {
  CopyFilled,
  CopyOutlined,
  EditOutlined,
  EllipsisOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { FloatButton } from 'antd';
import { useTranslation } from 'react-i18next';

import type { ConversationEntry } from '../../../../types';

type MessageFloatButtonProps = {
  hoveredBubble: {
    current: HTMLDivElement | null;
    entry: ConversationEntry | null;
  };
  floatButtonsPosition: {
    xRight: number;
    yTop: number;
  };
  isAudioPlaying: boolean;
  isStopAudio: boolean;
  editingEntryId: string | null;
  editingMessage: string;
  handleCancelEdit: () => void;
  handleEdit: (entryId: string, message: string) => void;
  handleSaveEdit: (entryId: string, message: string) => void;
  handleConvertTextToVoice: (text: string) => void;
  copied: Record<string, boolean>;
  handleCopy: (text: string, entryId: string) => void;
  handleRedo: (entryId: string) => void;
};

export const MessageFloatButton: React.FC<MessageFloatButtonProps> = ({
  hoveredBubble,
  floatButtonsPosition,
  isAudioPlaying,
  isStopAudio,
  editingEntryId,
  editingMessage,
  handleSaveEdit,
  handleCancelEdit,
  handleEdit,
  handleConvertTextToVoice,
  copied,
  handleCopy,
  handleRedo,
}) => {
  if (!hoveredBubble.current || !hoveredBubble.entry) return null;

  const { t } = useTranslation('common');

  const EditFloatButton = () => (
    <FloatButton
      icon={<EditOutlined />}
      onClick={() => {
        if (!hoveredBubble.entry) return;

        editingEntryId === hoveredBubble.entry.id
          ? handleCancelEdit()
          : handleEdit(hoveredBubble.entry.id, hoveredBubble.entry.message);
      }}
    />
  );

  return (
    <FloatButton.Group
      shape='circle'
      style={{
        bottom: window.innerHeight - floatButtonsPosition.yTop - 37,
        insetInlineEnd: 35,
        visibility: hoveredBubble ? 'visible' : 'hidden',
      }}
      icon={<EllipsisOutlined />}
      trigger='click'
      tooltip={t('showActions')}
      placement={'bottom'}
    >
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
          {hoveredBubble.entry?.role === 'AI' && (
            <FloatButton
              icon={<RedoOutlined />}
              onClick={() => {
                if (!hoveredBubble.entry) return;

                handleRedo(hoveredBubble.entry.id);
              }}
            />
          )}
          <EditFloatButton />
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
          <EditFloatButton />
          <FloatButton
            icon={<SaveOutlined />}
            onClick={() => {
              if (!hoveredBubble.entry) return;

              handleSaveEdit(hoveredBubble.entry.id, editingMessage);
            }}
          />
        </>
      )}
    </FloatButton.Group>
  );
};
