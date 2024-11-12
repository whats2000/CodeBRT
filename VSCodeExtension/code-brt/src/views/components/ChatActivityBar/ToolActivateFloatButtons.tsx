import React, { useEffect } from 'react';
import { Button, FloatButton, Space } from 'antd';
import {
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { ToolServiceType } from '../../../types';
import { useRefs } from '../../context/RefContext';
import type { AppDispatch, RootState } from '../../redux';
import { MagicWandOutlined } from '../../icons';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';
import { setRefId } from '../../redux/slices/tourSlice';

const TOOLS_MAP: {
  [key in ToolServiceType]: {
    icon: React.ReactNode;
    tooltip: string;
    moreInfo?: React.ReactNode;
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
    moreInfo: (
      <Button
        icon={<QuestionCircleOutlined />}
        type='text'
        href={
          'https://whats2000.github.io/CodeBRT/docs/features/automated-tasks/'
        }
      />
    ),
  },
};

export interface ToolActivateFloatButtonsProps {
  floatButtonBaseYPosition: number;
}

export const ToolActivateFloatButtons: React.FC<
  ToolActivateFloatButtonsProps
> = ({ floatButtonBaseYPosition }) => {
  const { registerRef } = useRefs();

  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings } = useSelector(
    (state: RootState) => state.settings,
  );

  const { isLoading: historyLoading } = useSelector(
    (state: RootState) => state.conversation,
  );

  const toolFloatButtonsRef = registerRef('toolFloatButtons');

  useEffect(() => {
    dispatch(
      setRefId({
        tourName: 'quickStart',
        targetId: 'toolFloatButtons',
        stepIndex: 4,
      }),
    );
  }, [dispatch]);

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
    <>
      <div
        ref={toolFloatButtonsRef}
        style={{
          position: 'absolute',
          bottom: floatButtonBaseYPosition,
          insetInlineEnd: 40,
          height: 40,
          width: 40,
        }}
      />
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
                <Space size={1}>
                  {isActive
                    ? `Disable ${tool.tooltip}`
                    : `Enable ${tool.tooltip}`}
                  {tool.moreInfo}
                </Space>
              }
              type={isActive ? 'primary' : 'default'}
              onClick={() => handleSettingChange(toolKey)}
            />
          );
        })}
      </FloatButton.Group>
    </>
  );
};
