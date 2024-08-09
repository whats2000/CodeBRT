import React, { useContext, useEffect, useState } from 'react';
import { FloatButton } from 'antd';
import {
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import type { ToolServiceType } from '../../../types';
import { WebviewContext } from '../../WebviewContext';
import { MagicWand } from '../../icons';
import { useWindowSize } from '../../hooks';

export interface ToolActivateFloatButtonsProps {
  inputContainerRef: React.RefObject<HTMLDivElement>;
}

export const ToolActivateFloatButtons: React.FC<
  ToolActivateFloatButtonsProps
> = ({ inputContainerRef }) => {
  const { callApi } = useContext(WebviewContext);
  const { innerWidth } = useWindowSize();

  const [partialSettings, setPartialSettings] = useState<{
    enableTools: { [key in ToolServiceType]: { active: boolean } };
  }>({
    enableTools: {
      webSearch: { active: false },
      urlFetcher: { active: false },
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [yPosition, setYPosition] = useState(60);
  const [floatButtonsXPosition, setFloatButtonsXPosition] = useState(0);

  useEffect(() => {
    setFloatButtonsXPosition(innerWidth - 84);
  }, [innerWidth]);

  useEffect(() => {
    setIsLoading(true);
    callApi('getSetting', 'enableTools').then((value) => {
      setPartialSettings({ enableTools: value });
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const updateYPosition = () => {
      if (inputContainerRef.current) {
        const { height } = inputContainerRef.current.getBoundingClientRect();
        setYPosition(height + 20);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateYPosition();
    });

    if (inputContainerRef.current) {
      resizeObserver.observe(inputContainerRef.current);
    }

    // Cleanup the observer on component unmount
    return () => {
      if (inputContainerRef.current) {
        resizeObserver.unobserve(inputContainerRef.current);
      }
    };
  }, [inputContainerRef]);

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
      icon={isLoading ? <LoadingOutlined /> : <MagicWand />}
      trigger='click'
      tooltip={'Activate Tools'}
      style={{ bottom: yPosition, left: floatButtonsXPosition }}
    >
      <FloatButton
        icon={<GlobalOutlined />}
        tooltip={'Web Search'}
        type={
          partialSettings.enableTools.webSearch.active ? 'primary' : 'default'
        }
        onClick={() => handleSettingChange('webSearch')}
      />
      <FloatButton
        icon={<FileSearchOutlined />}
        tooltip={'Url Fetcher'}
        type={
          partialSettings.enableTools.urlFetcher.active ? 'primary' : 'default'
        }
        onClick={() => handleSettingChange('urlFetcher')}
      />
    </FloatButton.Group>
  );
};
