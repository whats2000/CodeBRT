import React from 'react';
import { Drawer } from 'antd';
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
    ></Drawer>
  );
};
