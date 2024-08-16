import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux';

import { WebviewApi, WithWebviewContext } from './WebviewContext';
import { ChatActivityBar } from './components/ChatActivityBar';
import { WorkPanel } from './components/WorkPanel';

const resetCss = require('antd/dist/reset.css').default.toString();

/**
 * Views that can be connected to the extension
 * If a new view is added, it should be added here as well.
 */
export const Views = {
  chatActivityBar: ChatActivityBar,
  workPanel: WorkPanel,
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

  // Append styles to the document head
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `${resetCss}`;
  document.head.appendChild(styleElement);

  const root = createRoot(container);

  root.render(
    <WithWebviewContext vscodeApi={vscodeApi}>
      <Provider store={store}>
        <Component />
      </Provider>
    </WithWebviewContext>,
  );
}
