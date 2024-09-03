import React, { useContext, useEffect, useState } from 'react';
import { FloatButton } from 'antd';
import {
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import type { ToolServiceType } from '../../../types';
import { WebviewContext } from '../../WebviewContext';
import { MagicWandOutlined } from '../../icons';

export interface ToolActivateFloatButtonsProps {
  floatButtonsXPosition: number;
  floatButtonBaseYPosition: number;
}

export const ToolActivateFloatButtons: React.FC<
  ToolActivateFloatButtonsProps
> = ({ floatButtonsXPosition, floatButtonBaseYPosition }) => {
  const { callApi } = useContext(WebviewContext);

  const [partialSettings, setPartialSettings] = useState<{
    enableTools: { [key in ToolServiceType]: { active: boolean } };
  }>({
    enableTools: {
      webSearch: { active: false },
      urlFetcher: { active: false },
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    callApi('getSetting', 'enableTools').then((value) => {
      setPartialSettings({ enableTools: value });
      setIsLoading(false);
    });
  }, []);

  const handleSettingChange = (key: ToolServiceType) => {
    setIsLoading(true);
    callApi('setSetting', 'enableTools', {
      ...partialSettings.enableTools,
      [key]: { active: !partialSettings.enableTools[key].active },
    }).then(() => {
      setPartialSettings((prev) => ({
        enableTools: {
          ...prev.enableTools,
          [key]: { active: !prev.enableTools[key].active },
        },
      }));
      setIsLoading(false);
    });
  };

  return (
    <FloatButton.Group
      icon={isLoading ? <LoadingOutlined /> : <MagicWandOutlined />}
      trigger='click'
      tooltip={'Activate Tools'}
      style={{ bottom: floatButtonBaseYPosition, left: floatButtonsXPosition }}
    >
      <FloatButton
        icon={<GlobalOutlined />}
        tooltip={
          partialSettings.enableTools.webSearch.active
            ? 'Disable Web Search'
            : 'Enable Web Search'
        }
        type={
          partialSettings.enableTools.webSearch.active ? 'primary' : 'default'
        }
        onClick={() => handleSettingChange('webSearch')}
      />
      <FloatButton
        icon={<FileSearchOutlined />}
        tooltip={
          partialSettings.enableTools.urlFetcher.active
            ? 'Disable URL Fetcher'
            : 'Enable URL Fetcher'
        }
        type={
          partialSettings.enableTools.urlFetcher.active ? 'primary' : 'default'
        }
        onClick={() => handleSettingChange('urlFetcher')}
      />
    </FloatButton.Group>
  );
};
