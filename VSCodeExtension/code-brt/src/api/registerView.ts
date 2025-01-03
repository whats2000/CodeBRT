import path from 'node:path';

import * as vscode from 'vscode';
import { randomBytes } from 'crypto';

import type {
  ViewApi,
  ViewApiRequest,
  ViewApiResponse,
  ViewApiError,
  ViewEvents,
} from '../types';
import type { ViewKey } from '../views';
import { SettingsManager } from '../api';

const DEV_SERVER_HOST = 'http://localhost:18080';

export const connectedViews: Partial<Record<string, vscode.WebviewView>> = {};

const isViewApiRequest = <K extends keyof ViewApi>(
  msg: unknown,
): msg is ViewApiRequest<K> =>
  msg != null &&
  typeof msg === 'object' &&
  'type' in msg &&
  msg.type === 'request';

const template = (params: {
  csp: string;
  view: ViewKey;
  srcUri: string;
  publicPath: string;
  title: string;
  nonce: string;
}) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${params.title}</title>
    <meta http-equiv="Content-Security-Policy" content="${params.csp}" />
  </head>

  <body style="padding: 0 10px;">
    <div id="root"></div>
    <script type="module" nonce="${params.nonce}">
      import { render } from "${params.srcUri}";
      render("${params.view}", acquireVsCodeApi(), "${params.publicPath}");
    </script>
  </body>
</html>
`;

const createView = async <V extends ViewKey>(
  ctx: vscode.ExtensionContext,
  viewId: V,
  options?: vscode.WebviewOptions,
  retainContextWhenHidden = false,
): Promise<vscode.WebviewView> => {
  return await new Promise((resolve, reject) => {
    let dispose: vscode.Disposable;
    try {
      const provider: vscode.WebviewViewProvider = {
        resolveWebviewView: (view, _viewCtx, _token) => {
          try {
            view.onDidDispose(() => {
              dispose.dispose();
            });
            view.webview.options = { ...options };
            resolve(view);
          } catch (err: unknown) {
            reject(err);
          }
        },
      };
      dispose = vscode.window.registerWebviewViewProvider(viewId, provider, {
        webviewOptions: {
          retainContextWhenHidden,
        },
      });
      ctx.subscriptions.push(dispose);
    } catch (err: unknown) {
      reject(err);
    }
  });
};

const setViewHtml = <V extends ViewKey>(
  ctx: vscode.ExtensionContext,
  viewId: V,
  webview: vscode.Webview,
) => {
  const isProduction = ctx.extensionMode === vscode.ExtensionMode.Production;
  const nonce = randomBytes(16).toString('base64');

  const uri = (...parts: string[]) =>
    webview
      .asWebviewUri(vscode.Uri.file(path.join(ctx.extensionPath, ...parts)))
      .toString(true);

  const publicPath = isProduction ? uri() : `${DEV_SERVER_HOST}/`;
  const srcUri = isProduction ? uri('views.js') : `${DEV_SERVER_HOST}/views.js`;

  const csp = (
    isProduction
      ? [
          `form-action 'none';`,
          `default-src ${webview.cspSource};`,
          `script-src ${webview.cspSource} 'nonce-${nonce}';`,
          `style-src ${webview.cspSource} ${DEV_SERVER_HOST} 'unsafe-inline';`,
          `img-src ${webview.cspSource} vscode-resource:;`,
        ]
      : [
          `form-action 'none';`,
          `default-src ${webview.cspSource} ${DEV_SERVER_HOST};`,
          `style-src ${webview.cspSource} ${DEV_SERVER_HOST} 'unsafe-inline';`,
          `script-src ${webview.cspSource} ${DEV_SERVER_HOST} 'nonce-${nonce}';`,
          `connect-src 'self' ${webview.cspSource} ${DEV_SERVER_HOST} ws:;`,
          `img-src ${webview.cspSource} vscode-resource:;`,
        ]
  ).join(' ');

  webview.html = template({
    title: 'Example',
    csp,
    srcUri,
    publicPath,
    view: viewId,
    nonce,
  });
  return webview;
};

const viewRegistration = async <V extends ViewKey>(
  ctx: vscode.ExtensionContext,
  viewId: V,
  options?: vscode.WebviewOptions,
  retainContextWhenHidden = false,
) => {
  const view = await createView(ctx, viewId, options, retainContextWhenHidden);
  setViewHtml(ctx, viewId, view.webview);
  return view;
};

/**
 * Trigger an event on all connected views
 * @param key - The event key
 * @param params - The event parameters
 */
export const triggerEvent = <E extends keyof ViewEvents>(
  key: E,
  ...params: Parameters<ViewEvents[E]>
) => {
  Object.values(connectedViews).forEach((view) => {
    view?.webview.postMessage({
      type: 'event',
      key,
      value: params,
    });
  });
};

/**
 * Register a view and connect it to the provided API
 * @param ctx - The extension context
 * @param settingsManager - The settings register
 * @param key - The view key
 * @param api - The API to connect to the view
 */
export const registerAndConnectView = async <V extends ViewKey>(
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
  key: V,
  api: ViewApi,
) => {
  try {
    const webviewOptions: vscode.WebviewOptions = {
      enableScripts: true,
    };
    const retainContextWhenHidden = settingsManager.get(
      'retainContextWhenHidden',
    );
    const view = await viewRegistration(
      ctx,
      key,
      webviewOptions,
      retainContextWhenHidden,
    );
    connectedViews[key] = view;
    const onMessage = async (msg: Record<string, unknown>) => {
      if (!isViewApiRequest(msg)) {
        return;
      }
      try {
        // @ts-expect-error
        const val = await api[msg.key](...msg.params);
        const res: ViewApiResponse = {
          type: 'response',
          id: msg.id,
          value: val,
        };
        view.webview.postMessage(res);
      } catch (e: unknown) {
        const err: ViewApiError = {
          type: 'error',
          id: msg.id,
          value:
            e instanceof Error ? e.message : 'An unexpected error occurred',
        };
        view.webview.postMessage(err);
      }
    };

    view.webview.onDidReceiveMessage(onMessage);
  } catch (err: unknown) {
    console.error(err);
  }
};
