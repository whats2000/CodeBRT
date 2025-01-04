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
import { useTranslation } from 'react-i18next';

import type { ToolServiceType } from '../../../types';
import { useRefs } from '../../context/RefContext';
import type { AppDispatch, RootState } from '../../redux';
import { MagicWandOutlined } from '../../icons';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';
import { setRefId } from '../../redux/slices/tourSlice';

export interface ToolActivateFloatButtonsProps {
  floatButtonBaseYPosition: number;
}

export const ToolActivateFloatButtons: React.FC<
  ToolActivateFloatButtonsProps
> = ({ floatButtonBaseYPosition }) => {
  const { t } = useTranslation('common');
  const { registerRef } = useRefs();

  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, settings } = useSelector(
    (state: RootState) => state.settings,
  );

  const { isLoading: historyLoading } = useSelector(
    (state: RootState) => state.conversation,
  );

  const toolFloatButtonsRef = registerRef('toolFloatButtons');

  const TOOLS_MAP: {
    [key in ToolServiceType]: {
      icon: React.ReactNode;
      tooltip: string;
      moreInfo?: React.ReactNode;
    };
  } = {
    webSearch: {
      icon: <GlobalOutlined />,
      tooltip: t('webSearch'),
    },
    urlFetcher: {
      icon: <FileSearchOutlined />,
      tooltip: t('urlFetcher'),
    },
    agentTools: {
      icon: <RobotOutlined />,
      tooltip: t('agentTools'),
      moreInfo: (
        <Button
          icon={<QuestionCircleOutlined />}
          type='text'
          href={
            'https://whats2000.github.io/CodeBRT/docs/features/automated-tasks/agent-tools'
          }
        />
      ),
    },
  };

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
          insetInlineEnd: 35,
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
        tooltip={t('activate', { tool: t('tools') })}
        style={{
          bottom: floatButtonBaseYPosition,
          insetInlineEnd: 35,
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
                    ? t('disable', { tool: tool.tooltip })
                    : t('enable', { tool: tool.tooltip })}
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
