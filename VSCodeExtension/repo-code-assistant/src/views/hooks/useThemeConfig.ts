import { useContext, useEffect, useState } from 'react';
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

import { WebviewContext } from '../WebviewContext';

export const useThemeConfig = (): [
  ThemeConfig,
  (newTheme: {
    primaryColor?: string;
    algorithm?: 'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm';
    borderRadius?: number;
  }) => Promise<void>,
] => {
  const { callApi } = useContext(WebviewContext);
  const [primaryColor, setPrimaryColor] = useState('#f0f0f0');
  const [algorithm, setAlgorithm] = useState<
    'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm'
  >('darkAlgorithm');
  const [borderRadius, setBorderRadius] = useState(4);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const color = (await callApi(
          'getSetting',
          'themePrimaryColor',
        )) as string;
        setPrimaryColor(color || '#f0f0f0');

        const algo = (await callApi('getSetting', 'themeAlgorithm')) as
          | 'defaultAlgorithm'
          | 'darkAlgorithm';
        setAlgorithm(algo || 'darkAlgorithm');

        const radius = (await callApi(
          'getSetting',
          'themeBorderRadius',
        )) as number;
        setBorderRadius(radius !== undefined ? radius : 4);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings().catch(console.error);
  }, []);

  const setTheme = async (newTheme: {
    primaryColor?: string;
    algorithm?: 'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm';
    borderRadius?: number;
  }) => {
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
};
