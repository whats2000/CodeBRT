import React from 'react';
import { createRoot } from 'react-dom/client';

import { WebviewApi, WithWebviewContext } from './WebviewContext';
import { ChatActivityBar } from './ChatActivityBar';
import { WorkPanel } from './WorkPanel';
import { SettingsBar } from './SettingsBar';

/**
 * Views that can be connected to the extension
 * If a new view is added, it should be added here as well.
 */
export const Views = {
  chatActivityBar: ChatActivityBar,
  workPanel: WorkPanel,
  settingsBar: SettingsBar,
} as const;

/**
 * Represents the key for the view.
 */
export type ViewKey = keyof typeof Views;

export function render<V extends ViewKey>(
  key: V,
  vscodeApi: WebviewApi,
  publicPath: string,
  rootId = 'root',
) {
  const container = document.getElementById(rootId);
  if (!container) {
    throw new Error(`Element with id of ${rootId} not found.`);
  }

  __webpack_public_path__ = publicPath;

  const Component: React.ComponentType = Views[key];

  const root = createRoot(container);

  root.render(
    <WithWebviewContext vscodeApi={vscodeApi}>
      <Component />
    </WithWebviewContext>,
  );
}
