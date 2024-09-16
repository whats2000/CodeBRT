import { useContext, useEffect, useState } from 'react';
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

import { WebviewContext } from '../WebviewContext';
import { ExtensionSettings } from '../../types';

type FrontendTheme = {
  primaryColor?: ExtensionSettings['themePrimaryColor'];
  algorithm?: ExtensionSettings['themeAlgorithm'];
  borderRadius?: ExtensionSettings['themeBorderRadius'];
};

export const useThemeConfig = (): [
  ThemeConfig,
  (newTheme: FrontendTheme) => Promise<void>,
] => {
  const { callApi } = useContext(WebviewContext);
  const [primaryColor, setPrimaryColor] = useState('#f0f0f0');
  const [algorithm, setAlgorithm] =
    useState<ExtensionSettings['themeAlgorithm']>('darkAlgorithm');
  const [borderRadius, setBorderRadius] = useState(4);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const color = (await callApi(
          'getSettingByKey',
          'themePrimaryColor',
        )) as ExtensionSettings['themePrimaryColor'];
        setPrimaryColor(color || '#f0f0f0');

        const algo = (await callApi(
          'getSettingByKey',
          'themeAlgorithm',
        )) as ExtensionSettings['themeAlgorithm'];
        setAlgorithm(algo || ['darkAlgorithm']);

        const radius = (await callApi(
          'getSettingByKey',
          'themeBorderRadius',
        )) as ExtensionSettings['themeBorderRadius'];
        setBorderRadius(radius !== undefined ? radius : 4);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings().catch(console.error);
  }, []);

  const setTheme = async (newTheme: FrontendTheme) => {
    try {
      if (newTheme.primaryColor) {
        setPrimaryColor(newTheme.primaryColor);
      }
      if (newTheme.algorithm) {
        setAlgorithm(newTheme.algorithm);
      }
      if (newTheme.borderRadius !== undefined) {
        setBorderRadius(newTheme.borderRadius);
      }
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };

  if (typeof algorithm === 'string') {
    return [
      {
        algorithm: theme[algorithm],
        token: {
          colorPrimary: primaryColor,
          borderRadius: borderRadius,
        },
      },
      setTheme,
    ];
  }

  return [
    {
      algorithm: algorithm.map((algo) => theme[algo]),
      token: {
        colorPrimary: primaryColor,
        borderRadius: borderRadius,
      },
    },
    setTheme,
  ];
};
