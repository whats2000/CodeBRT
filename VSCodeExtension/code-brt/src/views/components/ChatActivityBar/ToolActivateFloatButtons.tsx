import React from 'react';
import { FloatButton } from 'antd';
import {
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { ToolServiceType } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import { MagicWandOutlined } from '../../icons';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';

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

  const handleSettingChange = (key: ToolServiceType) => {
    dispatch(
      updateAndSaveSetting({
        key: 'enableTools',
        value: {
          ...settings.enableTools,
          [key]: { active: !settings.enableTools[key].active },
        },
      }),
    );
  };

  return (
    <FloatButton.Group
      icon={isLoading ? <LoadingOutlined /> : <MagicWandOutlined />}
      trigger='click'
      tooltip={'Activate Tools'}
      style={{
        bottom: floatButtonBaseYPosition,
        insetInlineEnd: 40,
      }}
    >
      <FloatButton
        icon={<GlobalOutlined />}
        tooltip={
          settings.enableTools.webSearch.active
            ? 'Disable Web Search'
            : 'Enable Web Search'
        }
        type={settings.enableTools.webSearch.active ? 'primary' : 'default'}
        onClick={() => handleSettingChange('webSearch')}
      />
      <FloatButton
        icon={<FileSearchOutlined />}
        tooltip={
          settings.enableTools.urlFetcher.active
            ? 'Disable URL Fetcher'
            : 'Enable URL Fetcher'
        }
        type={settings.enableTools.urlFetcher.active ? 'primary' : 'default'}
        onClick={() => handleSettingChange('urlFetcher')}
      />
    </FloatButton.Group>
  );
};
