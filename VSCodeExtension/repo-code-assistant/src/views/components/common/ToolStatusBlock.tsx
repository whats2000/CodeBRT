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
        <Typography.Text style={{ display: 'flex', alignItems: 'center' }}>
          <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          {statusMessage}
        </Typography.Text>
      );
    case 'warning':
      return (
        <Typography.Text style={{ display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleOutlined
            style={{ color: '#faad14', marginRight: 8 }}
          />
          {statusMessage}
        </Typography.Text>
      );
    case 'error':
      return (
        <Typography.Text style={{ display: 'flex', alignItems: 'center' }}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {statusMessage}
        </Typography.Text>
      );
    case 'searching':
      return (
        <Typography.Text style={{ display: 'flex', alignItems: 'center' }}>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            style={{ marginRight: 8 }}
          />
          {statusMessage}
        </Typography.Text>
      );
    default:
      return <Typography.Text>{status}</Typography.Text>;
  }
};
