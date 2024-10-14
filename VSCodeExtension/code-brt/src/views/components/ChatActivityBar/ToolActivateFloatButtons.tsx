import React from 'react';
import { FloatButton } from 'antd';
import {
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import { ToolServiceType } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import { MagicWandOutlined } from '../../icons';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';

const TOOLS_MAP: {
  [key in ToolServiceType]: {
    icon: React.ReactNode;
    tooltip: string;
  };
} = {
  webSearch: {
    icon: <GlobalOutlined />,
    tooltip: 'Web Search',
  },
  urlFetcher: {
    icon: <FileSearchOutlined />,
    tooltip: 'URL Fetcher',
  },
  agentTools: {
    icon: <RobotOutlined />,
    tooltip: 'Agent Tools',
  },
};

export interface ToolActivateFloatButtonsProps {
  floatButtonBaseYPosition: number;
}

export const ToolActivateFloatButtons: React.FC<
  ToolActivateFloatButtonsProps
> = ({ floatButtonBaseYPosition }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings } = useSelector(
    (state: RootState) => state.settings,
  );

  const { isLoading: historyLoading } = useSelector(
    (state: RootState) => state.conversation,
  );

  const handleSettingChange = (key: ToolServiceType) => {
    if (isLoading || historyLoading) return;

    dispatch(
      updateAndSaveSetting({
        key: 'enableTools',
        value: {
          ...settings.enableTools,
          [key]: { active: !settings.enableTools[key]?.active },
        },
      }),
    );
  };

  return (
    <FloatButton.Group
      icon={
        isLoading || historyLoading ? (
          <LoadingOutlined />
        ) : (
          <MagicWandOutlined />
        )
      }
      trigger='click'
      tooltip={'Activate Tools'}
      style={{
        bottom: floatButtonBaseYPosition,
        insetInlineEnd: 40,
      }}
    >
      {(Object.keys(TOOLS_MAP) as ToolServiceType[]).map((toolKey) => {
        const tool = TOOLS_MAP[toolKey];
        const isActive = settings.enableTools[toolKey]?.active;

        return (
          <FloatButton
            key={toolKey}
            icon={tool.icon}
            tooltip={
              isActive ? `Disable ${tool.tooltip}` : `Enable ${tool.tooltip}`
            }
            type={isActive ? 'primary' : 'default'}
            onClick={() => handleSettingChange(toolKey)}
          />
        );
      })}
    </FloatButton.Group>
  );
};
