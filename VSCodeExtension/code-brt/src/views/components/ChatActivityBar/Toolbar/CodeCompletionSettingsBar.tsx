import React from 'react';
import { Divider, Drawer, Typography } from 'antd';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../redux';

type CodeCompletionSettingsBarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CodeCompletionSettingsBar: React.FC<
  CodeCompletionSettingsBarProps
> = ({ isOpen, onClose }) => {
  const { isLoading } = useSelector((state: RootState) => state.settings);

  return (
    <Drawer
      title='Code Completion Settings'
      placement='left'
      open={isOpen}
      onClose={onClose}
      width={400}
      loading={isLoading}
    >
      <Divider orientation={'left'} orientationMargin={0}>
        <Typography.Text type='secondary'>
          Manually Trigger Configuration
        </Typography.Text>
      </Divider>
      <Typography.Text type='secondary'>
        This will use more context, resources and token to provide higher
        quality completions.
      </Typography.Text>
      <Divider orientation={'left'} orientationMargin={0}>
        <Typography.Text type='secondary'>
          Auto Trigger Configuration
        </Typography.Text>
      </Divider>
      <Typography.Text type='secondary'>
        This will use when you typing pause for a moment. Which mean will faster
        suit for simple code snippet.
      </Typography.Text>
    </Drawer>
  );
};
