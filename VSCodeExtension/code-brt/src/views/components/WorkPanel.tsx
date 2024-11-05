import React from 'react';
import { ConfigProvider } from 'antd';

import { useThemeConfig } from '../hooks';

export const WorkPanel: React.FC = () => {
  const [theme] = useThemeConfig();

  return <ConfigProvider theme={theme}></ConfigProvider>;
};
