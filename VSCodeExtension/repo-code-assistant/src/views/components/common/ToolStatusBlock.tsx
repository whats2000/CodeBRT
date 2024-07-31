import React from 'react';
import {
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Spin, Typography } from 'antd';

type ToolStatusBlockProps = {
  status: string;
};

export const ToolStatusBlock: React.FC<ToolStatusBlockProps> = ({ status }) => {
  const statusType = status.match(/^\[([^\]]+)]/)?.[1].toLowerCase();
  const statusMessage = status.replace(/^\[[^\]]+]\s/, '');

  switch (statusType) {
    case 'info':
      return (
        <Typography.Paragraph style={{ display: 'flex', alignItems: 'center' }}>
          <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          {statusMessage}
        </Typography.Paragraph>
      );
    case 'warning':
      return (
        <Typography.Paragraph style={{ display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleOutlined
            style={{ color: '#faad14', marginRight: 8 }}
          />
          {statusMessage}
        </Typography.Paragraph>
      );
    case 'error':
      return (
        <Typography.Paragraph style={{ display: 'flex', alignItems: 'center' }}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {statusMessage}
        </Typography.Paragraph>
      );
    case 'searching':
      return (
        <Typography.Paragraph style={{ display: 'flex', alignItems: 'center' }}>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            style={{ marginRight: 8 }}
          />
          {statusMessage}
        </Typography.Paragraph>
      );
    default:
      return <Typography.Paragraph>{status}</Typography.Paragraph>;
  }
};
