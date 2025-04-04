import React from 'react';
import { Tooltip, Tag } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  CodeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const getMentionIcon = (mention: string) => {
  if (mention.startsWith('@problem:')) return <ExclamationCircleOutlined />;
  if (mention.startsWith('@terminal:')) return <CodeOutlined />;
  if (mention.startsWith('#folder:')) return <FolderOutlined />;
  if (mention.startsWith('#file:')) return <FileOutlined />;
  return null;
};

const MentionTag = (props: { mention: string; onRemove: () => void }) => {
  const { t } = useTranslation('common');
  const { mention, onRemove } = props;
  const icon = getMentionIcon(mention);
  let cleanMention = mention
    .replace('@problem:', '')
    .replace('#folder:', '')
    .replace('#file:', '');

  if (mention.startsWith('@')) {
    return (
      <Tag
        closable={true}
        onClose={onRemove}
        icon={icon}
        style={{ marginTop: 3, marginBottom: 3 }}
      >
        <Tooltip title={mention.replace('@problem:', '')}>
          {t(`inputMessageArea.${cleanMention.trim()}Problem`)}
        </Tooltip>
      </Tag>
    );
  }
  if (mention.startsWith('#')) {
    let shorterMention = cleanMention;
    if (mention.includes('/') || mention.includes('\\')) {
      shorterMention = cleanMention.split(/[\\/]/).pop() || '';
    }

    return (
      <Tag
        closable={true}
        onClose={onRemove}
        icon={icon}
        style={{ marginTop: 3, marginBottom: 3 }}
      >
        <Tooltip title={mention.replace(/#(file|folder):/, '')}>
          {shorterMention}
        </Tooltip>
      </Tag>
    );
  }
};

export const MentionsDisplay: React.FC<{
  visibleMentions: string[];
  removeMention: (mention: string) => void;
}> = ({ visibleMentions, removeMention }) => {
  if (visibleMentions.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: '10px',
      }}
    >
      {visibleMentions.map(
        (mention) =>
          mention && (
            <MentionTag
              key={mention}
              mention={mention}
              onRemove={() => removeMention(mention)}
            />
          ),
      )}
    </div>
  );
};
