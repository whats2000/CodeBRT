import React, { useState, useEffect } from 'react';
import { Card, Tooltip, Typography, Space } from 'antd';
import styled from 'styled-components';
import {
  CloseOutlined,
  FolderOutlined,
  FileOutlined,
  CodeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const SelectedCodeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 10px;
`;

const StyledCard = styled(Card)`
  div.ant-card-body {
    padding: 0;
  }
`;

const getMentionIcon = (mention: string) => {
  if (mention.startsWith('@problem:')) return <ExclamationCircleOutlined />;
  if (mention.startsWith('@terminal:')) return <CodeOutlined />;
  if (mention.startsWith('#folder:')) return <FolderOutlined />;
  if (mention.startsWith('#file:')) return <FileOutlined />;
  return null;
};

const MentionCard = (props: { mention: string; onRemove: () => void }) => {
  const { mention, onRemove } = props;
  const icon = getMentionIcon(mention);

  return (
    <StyledCard
      size='small'
      title={
        <Tooltip title={mention}>
          <Space>
            {icon}
            <Typography.Text>
              {mention
                .replace('problem:', '')
                .replace('terminal:', '')
                .replace('#folder:', '')
                .replace('#file:', '')
                .split(/[\\/]/)
                .pop()}
            </Typography.Text>
          </Space>
        </Tooltip>
      }
      extra={<CloseOutlined onClick={onRemove} />}
      style={{ width: '100%' }}
    />
  );
};

export const MentionsDisplay: React.FC<{
  inputMessage: string;
  setInputMessage: (value: string) => void;
}> = ({ inputMessage, setInputMessage }) => {
  const mentionRegex = /[@#][\w-]+:[\w-\\/.]+/g;
  const [visibleMentions, setVisibleMentions] = useState<string[]>([]);

  useEffect(() => {
    const mentions = inputMessage.match(mentionRegex) || [];
    setVisibleMentions(mentions);
  }, [inputMessage]);

  const removeMention = (mention: string) => {
    const updatedMentions = visibleMentions.filter((m) => m !== mention);
    setVisibleMentions(updatedMentions);
    const updatedMessage = inputMessage.replace(mention, '').trim();
    setInputMessage(updatedMessage);
  };

  if (visibleMentions.length === 0) return null;

  return (
    <SelectedCodeContainer>
      {visibleMentions.map(
        (mention) =>
          mention && (
            <MentionCard
              key={mention}
              mention={mention}
              onRemove={() => removeMention(mention)}
            />
          ),
      )}
    </SelectedCodeContainer>
  );
};
