import { createRoot } from "react-dom/client";
import { WebviewApi, WithWebviewContext } from "./WebviewContext";
import { ChatActivityBar } from "./ChatActivityBar";
import { WorkPanel } from "./WorkPanel";
import React from "react";

export const Views = {
  chatActivityBar: ChatActivityBar,
  workPanel: WorkPanel,
} as const;

export type ViewKey = keyof typeof Views;

export function render<V extends ViewKey>(
  key: V,
  vscodeApi: WebviewApi,
  publicPath: string,
  rootId = "root"
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
    </WithWebviewContext>
  );
}
